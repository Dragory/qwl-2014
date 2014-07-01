var rooms = require('./rooms'),
	auth = require('./auth');

var toExport = function(socket) {
	socket.on('join-room', function(data) {
		var name = String(data.name);

		if (! rooms.exists(name)) {
			socket.emit('join-room:fail');
			return;
		}

		var clientInfo = auth.getClientInfoBySocket(socket);
		if (! clientInfo || ! clientInfo.permissions.canJoinRooms) {
			socket.emit('join-room:fail');
			return;
		}

		rooms.get(name).addClient(clientInfo);
	});

	socket.on('leave-room', function(data) {
		var name = String(data.name),
			clientInfo = auth.getClientInfoBySocket(socket);

		if (! clientInfo) {
			socket.emit('leave-room:fail');
			return;
		}

		if (! rooms.exists(name)) {
			socket.emit('leave-room:fail');
			return;
		}

		rooms.get(name).removeClient(clientInfo);
	});

	socket.on('disconnect', function() {
		var sRooms = socket.rooms,
			clientInfo = auth.getClientInfoBySocket(socket),
			i, len;

		sRooms.forEach(function(sRoom) {
			if (! rooms.exists(sRoom)) return;
			rooms.get(sRoom).removeClient(clientInfo);
		});
	});

	socket.on('create-room', function(data) {
		var name = String(data.name);
		var clientInfo = auth.getClientInfoBySocket(socket);

		if (! clientInfo || ! clientInfo.permissions.canCreateRooms) {
			socket.emit('create-room:fail');
			return;
		}

		if (rooms.exists(name)) {
			socket.emit('create-room:fail');
			return;
		}

		var room = rooms.create(name);

		if (room !== null) {
			room.addAdmin(clientInfo);
			room.addClient(clientInfo);
		}
	});

	socket.on('delete-room', function(data) {
		var name = String(data.name);
		var clientInfo = auth.getClientInfoBySocket(socket);

		if (! clientInfo || ! rooms.exists(name)) {
			socket.emit('delete-room:fail');
			return;
		}

		var room = rooms.get(name);

		if (room.hasAdmin(clientInfo) || clientInfo.permissions.canDeleteRooms) {
			room.delete();
		} else {
			socket.emit('delete-room:fail');
		}
	});

	socket.on('send-message', function(data) {
		var name = String(data.name),
			message = String(data.message);

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
		if (! rooms.exists(name)) {
			return;
		}

		var room = rooms.get(name);

		// Client not in room
		if (! room.hasClient(clientInfo)) {
			return;
		}

		room.sendMessage(clientInfo, message);
	});

	socket.on('get-messages', function(data) {
		var name = String(data.name),
			num = parseInt(data.num, 10) || 0,
			start = parseInt(data.start, 10) || 0;

		if (! rooms.exists(name)) {
			socket.emit('get-messages:fail');
			return;
		}

		socket.emit('loaded-messages', {
			name: name,
			messages: rooms.get(name).getMessages(num, start)
		});
	});
};

module.exports = toExport;