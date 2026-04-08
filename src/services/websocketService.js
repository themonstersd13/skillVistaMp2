const { Server } = require('socket.io');
const { WORKER_EVENTS, queueEventBus } = require('../workers/queue');

const SOCKET_EVENTS = {
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
  EVALUATION_FAILED: 'evaluation_failed',
  SUBSCRIBE_STUDENT: 'subscribe_student',
  SUBSCRIBE_FACULTY: 'subscribe_faculty',
  SUBSCRIBE_CUSTOM: 'subscribe_room',
};

let ioInstance = null;
let bridgeBound = false;

const getStudentRoom = (userId) => `student:${userId}`;
const getFacultyRoom = (facultyId) => `faculty:${facultyId}`;

const emitToRelevantRooms = (eventName, payload) => {
  if (!ioInstance) {
    return;
  }

  if (payload.userId) {
    ioInstance.to(getStudentRoom(payload.userId)).emit(eventName, payload);
  }

  if (payload.facultyId) {
    ioInstance.to(getFacultyRoom(payload.facultyId)).emit(eventName, payload);
  }
};

const bindWorkerEventBridge = () => {
  if (bridgeBound) {
    return;
  }

  bridgeBound = true;

  queueEventBus.on(WORKER_EVENTS.PROCESSING, (payload) => {
    emitToRelevantRooms(SOCKET_EVENTS.JOB_STARTED, payload);
  });

  queueEventBus.on(WORKER_EVENTS.COMPLETED, (payload) => {
    emitToRelevantRooms(SOCKET_EVENTS.JOB_COMPLETED, payload);
  });

  queueEventBus.on(WORKER_EVENTS.FAILED, (payload) => {
    emitToRelevantRooms(SOCKET_EVENTS.EVALUATION_FAILED, payload);
  });
};

const initializeWebsocket = (httpServer, corsOrigin) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: corsOrigin === '*' ? true : corsOrigin,
      credentials: true,
    },
  });

  bindWorkerEventBridge();

  ioInstance.on('connection', (socket) => {
    socket.on(SOCKET_EVENTS.SUBSCRIBE_STUDENT, ({ userId } = {}) => {
      if (!userId) {
        return;
      }

      socket.join(getStudentRoom(userId));
    });

    socket.on(SOCKET_EVENTS.SUBSCRIBE_FACULTY, ({ facultyId } = {}) => {
      if (!facultyId) {
        return;
      }

      socket.join(getFacultyRoom(facultyId));
    });

    socket.on(SOCKET_EVENTS.SUBSCRIBE_CUSTOM, ({ room } = {}) => {
      if (!room) {
        return;
      }

      socket.join(String(room));
    });

    socket.on('disconnect', () => {});
  });

  return ioInstance;
};

const getIo = () => ioInstance;

module.exports = {
  SOCKET_EVENTS,
  getStudentRoom,
  getFacultyRoom,
  initializeWebsocket,
  getIo,
};
