"""Redis-backed async task queue.

Scales horizontally. Uses redis Lists or falls back memory Queue if unconfigured.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Callable, Coroutine

from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class TaskQueue:
    """Redis-backed async task queue."""

    def __init__(self, max_workers: int = 3) -> None:
        self._max_workers = max_workers
        self._workers: list[asyncio.Task] = []
        self._running = False
        self._registry: dict[str, Callable[..., Coroutine]] = {}
        self._redis = None
        self._local_queue = asyncio.Queue() # Fallback

    def register(self, task_name: str, fn: Callable[..., Coroutine]):
        self._registry[task_name] = fn

    async def start(self) -> None:
        """Start background worker loops."""
        if self._running:
            return
        self._running = True

        if settings.has_redis:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(settings.redis_url)
                await self._redis.ping()
                logger.info("TaskQueue bounded to Redis at %s", settings.redis_url)
            except Exception as e:
                logger.error("Failed to connect to Redis: %s", e)
                logger.warning("Falling back to local asyncio queue.")
                self._redis = None
        else:
            logger.warning("No Redis URL found, falling back to local queue.")

        for i in range(self._max_workers):
            task = asyncio.create_task(self._worker_loop(f"worker-{i}"))
            self._workers.append(task)
        logger.info("TaskQueue started with %d workers", self._max_workers)

    async def stop(self) -> None:
        """Gracefully stop all workers."""
        self._running = False
        if self._redis:
            await self._redis.lpush("skillvista:tasks", json.dumps({"task_name": "__stop__"}))
        else:
            for _ in self._workers:
                await self._local_queue.put({"task_name": "__stop__"})

        if self._redis:
            await self._redis.aclose()
        
        for worker in self._workers:
            worker.cancel()
            
        self._workers.clear()
        logger.info("TaskQueue stopped")

    async def enqueue(self, task_name: str, payload: dict | None = None) -> None:
        """Add a task to the queue."""
        payload = payload or {}
        data = {"task_name": task_name, "payload": payload}
        
        if self._redis:
            await self._redis.lpush("skillvista:tasks", json.dumps(data))
        else:
            await self._local_queue.put(data)
            
        logger.debug("Enqueued task: %s", task_name)

    async def _worker_loop(self, worker_name: str) -> None:
        """Process tasks from the queue."""
        logger.debug("Worker %s started", worker_name)
        while self._running:
            try:
                if self._redis:
                    item = await self._redis.brpop(["skillvista:tasks"], timeout=5)
                    if not item:
                        continue
                    _, data_str = item
                    data = json.loads(data_str)
                else:
                    data = await asyncio.wait_for(self._local_queue.get(), timeout=5.0)

                task_name = data.get("task_name")
                payload = data.get("payload", {})

                if task_name == "__stop__":
                    break

                fn = self._registry.get(task_name)
                if not fn:
                    logger.error("[%s] Unknown task: %s", worker_name, task_name)
                    continue

                logger.info("[%s] Processing: %s => %s", worker_name, task_name, payload)
                await fn(**payload)
                logger.info("[%s] Completed: %s", worker_name, task_name)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("[%s] Task failed: %s", worker_name, data.get("task_name", "unknown"))

# ── Global task queue instance ──
task_queue = TaskQueue(max_workers=3)
