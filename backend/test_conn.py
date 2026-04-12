import asyncio
import redis.asyncio as aioredis
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    try:
        r = aioredis.from_url("redis://localhost:6379")
        await r.ping()
        print("Redis connected!")
        await r.aclose()
    except Exception as e:
        print(f"Redis failed: {e}")
        
    try:
        m = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        await m.admin.command('ping')
        print("Mongo connected!")
    except Exception as e:
        print(f"Mongo failed: {e}")

asyncio.run(check())
