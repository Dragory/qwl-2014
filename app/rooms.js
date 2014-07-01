var auth = require('./auth'),
	io = require('./io'),
	Room = require('./room');

var rooms = {};

module.exports = {
	exists: function(name) {
		return (typeof rooms[name] !== 'undefined');
	},

	create: function(name) {
		if (rooms[name]) return null;

		var room = rooms[name] = new Room(name);

		room.on('client-added', function(data) {
			var clientInfo = data.client,
				socket = auth.getSocketByClientId(clientInfo._clientId);

			socket.join(room.name);
			socket.emit('join-room', room.getInfo());
			io.to(room.name).emit('room:client-joined', {name: room.name, client: clientInfo});
		});

		room.on('client-removed', function(data) {
			var clientInfo = data.client,
				socket = auth.getSocketByClientId(clientInfo._clientId);

			socket.leave(room.name);
			socket.emit('leave-room', {name: room.name});
			io.to(room.name).emit('room:client-left', {name: room.name, client: clientInfo});
		});

		room.on('admin-added', function(data) {
			io.to(room.name).emit('room:admin-added', {name: room.name, client: data.client});
		});

		room.on('admin-removed', function(data) {
			io.to(room.name).emit('room:admin-removed', {name: room.name, client: data.client});
		});

		room.on('new-message', function(data) {
			io.to(room.name).emit('room:new-message', {name: room.name, message: data.message});
		});

		room.on('messages-cleared', function(data) {
			io.to(room.name).emit('room:messages-cleared', {name: room.name, client: data.client, message: data.message});
		});

		room.on('room-deleted', function(data) {
			io.to(room.name).emit('room:deleted', {name: room.name});

			var clients = room.getClients();

			clients.forEach(function(clientInfo) {
				var socket = auth.getSocketByClientId(clientInfo._clientId);
				socket.leave(room.name);
			});

			delete rooms[name];
		});

		return room;
	},

	get: function(name) {
		return rooms[name];
	}
};