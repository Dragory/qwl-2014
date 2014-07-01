var Promise = require('bluebird'),
	Room = require('./room'),
	io = require('./io'),
	auth = require('./auth');

var rooms = {};

function roomExists(name) {
	if (! name) return false;
	if (! rooms[String(name)]) return false;
	return true;
}

/**
 * Events
 */

var toExport = function(io, socket) {
	socket.on('join-room', function(data) {
		var name = String(data.name);

		if (! roomExists(name)) {
			socket.emit('join-room:fail');
			return;
		}

		var clientInfo = auth.getClientInfoBySocket(socket);
		if (! clientInfo || ! clientInfo.permissions.canJoinRooms) {
			socket.emit('join-room:fail');
			return;
		}

		rooms[name].addClient(clientInfo);
	});

	socket.on('leave-room', function(data) {
		var name = String(data.name),
			clientInfo = auth.getClientInfoBySocket(socket);

		if (! clientInfo) {
			socket.emit('leave-room:fail');
			return;
		}

		if (! roomExists(name)) {
			socket.emit('leave-room:fail');
			return;
		}

		rooms[name].removeClient(clientInfo);
	});

	socket.on('disconnect', function() {
		var sRooms = socket.rooms,
			clientInfo = auth.getClientInfoBySocket(socket),
			i, len;

		for (i = 0, len = sRooms.length; i < len; i++) {
			var name = sRooms[i];
			rooms[name].removeClient(clientInfo);
		}
	});

	socket.on('create-room', function(data) {
		var name = String(data.name);
		var clientInfo = auth.getClientInfoBySocket(socket);

		if (! clientInfo || ! clientInfo.permissions.canCreateRooms) {
			socket.emit('create-room:fail');
			return;
		}

		if (roomExists(name)) {
			socket.emit('create-room:fail');
			return;
		}

		rooms[name] = new Room(name);
		rooms[name].addAdmin(clientInfo);
		rooms[name].addClient(clientInfo);
	});

	socket.on('delete-room', function(data) {
		var name = String(data.name);
		var clientInfo = auth.getClientInfoBySocket(socket);

		if (! clientInfo || ! roomExists(name)) {
			socket.emit('delete-room:fail');
			return;
		}

		if (rooms[name].isAdmin(clientInfo) || clientInfo.permissions.canDeleteRooms) {
			rooms[name].delete();
			delete rooms[name];
		} else {
			socket.emit('delete-room:fail');
		}
	});

	socket.on('send-message', function(data) {
		var name = String(name),
			message = String(message);
		var clientInfo = auth.getClientInfoBySocket(socket);

		// Missing required data
		if (! name || ! message) {
			return;
		}

		// Missing auth or permissions
		if (! clientInfo || ! clientInfo.permissions.canSendMessages) {
			return;
		}

		// Room doesn't exist
		if (! roomExists(name)) {
			return;
		}

		// Client not in room
		if (! rooms[name].isInRoom(clientInfo)) {
			return;
		}

		rooms[name].sendMessage(clientInfo, message);
	});

	socket.on('get-messages', function() {
		var name = String(name),
			num = parseInt(num, 10);

		if (! roomExists[name]) {
			socket.emit('get-messages:fail');
			return;
		}

		socket.emit('loaded-messages', {
			name: name,
			messages: rooms[name].getMessages(num)
		});
	});
};

module.exports = toExport;