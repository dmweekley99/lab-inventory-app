// Socket.IO setup for real-time updates
let ioInstance = null;

function initSocket(server) {
    const { Server } = require("socket.io");
    ioInstance = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    ioInstance.on('connection', (socket) => {
        // Optionally, join rooms by group, etc.
        // socket.on('joinGroup', groupId => socket.join(`group_${groupId}`));
    });
}

function emitItemOrdered(item) {
    if (ioInstance) {
        ioInstance.emit('itemOrdered', item); // Optionally, emit to a room
    }
}

module.exports = { initSocket, emitItemOrdered };
