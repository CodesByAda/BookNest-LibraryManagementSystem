const { Server } = require("socket.io");

let io; // Define io globally
let connectedAdmins = new Set(); // Store connected admin socket IDs

const initializeSocket = (server) => {
    io = new Server(server);

    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        // When an admin logs in or visits any admin page, mark them as an admin
        socket.on("adminConnected", () => {
            connectedAdmins.add(socket.id);
            console.log("Admin on dashboard:", socket.id);
        });

        // Remove from the list when an admin disconnects
        socket.on("disconnect", () => {
            connectedAdmins.delete(socket.id);
            console.log("Admin left from dashboard:", socket.id);
        });
    });
};

// Function to emit events globally
const emitEvent = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = { initializeSocket, emitEvent };
