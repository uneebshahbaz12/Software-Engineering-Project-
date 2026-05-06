const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { PORT } = require('./config/env');
const setupGatheringSocket = require('./socket/gathering.socket');

const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

setupGatheringSocket(io);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Islam Learning Platform API running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Socket.IO: ws://localhost:${PORT}\n`);
});
