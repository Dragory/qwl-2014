var _ = require('lodash'),
	io = require('./io'),
	auth = require('./auth');

function Room(name) {
	this.name = name;
	this.messages = [];
	this.admins = [];
	this.clients = [];

	this.listeners = {};
}

Room.prototype.getInfo = function() {
	return {
		name: name,
		admins: this.admins,
		clients: this.clients
	};
};

Room.prototype.addClient = function(clientInfo) {
	if (_.indexOf(this.clients, clientInfo._clientId) > -1) return;

	var socket = auth.getSocketByClientId(clientInfo._clientId);

	socket.join(this.name);
	socket.emit('join-room', this.getInfo());
	io.to(this.name).emit('room:client-joined', {name: this.name, client: clientInfo});
};

Room.prototype.removeClient = function(clientInfo) {
	var clientIndex = _.indexOf(this.clients, clientInfo._clientId);
	if (clientIndex === -1) return;

	this.clients.splice(clientIndex, 1);

	var socket = auth.getSocketByClientId(clientInfo._clientId);

	socket.leave(this.name);
	socket.emit('leave-room', {name: this.name});
	io.to(this.name).emit('room:client-left', {name: this.name, client: clientInfo});
};

Room.prototype.isInRoom = function(clientInfo) {
	return (_.indexOf(this.clients, clientInfo._clientId) > -1);
};

Room.prototype.addAdmin = function(clientInfo) {
	if (_.indexOf(this.admins, clientInfo._clientId) > -1) return;
	io.to(this.name).emit('room:admin-added', {name: this.name, admin: clientInfo});
};

Room.prototype.removeAdmin = function(clientInfo) {
	if (_.indexOf(this.admins, clientInfo._clientId) === -1) return;
	io.to(this.name).emit('room:admin-removed', {name: this.name, admin: clientInfo});
};

Room.prototype.isAdmin = function(clientInfo) {
	return (_.indexOf(this.admins, clientInfo._clientId) > -1);
};

Room.prototype.sendMessage = function(clientInfo, message) {
	var messageObj = {sender: clientInfo, message: message};
	this.messages.push(messageObj);
	io.to(this.name).emit('room:message', _.assign({name: this.name}, messageObj));
};

// TODO: "Since"
Room.prototype.getMessages = function(num) {
	num = parseInt(num, 10);
	if (num <= 0) return [];

	return this.messages.slice(-1 * num);
};

Room.prototype.clearMessages = function() {
	this.messages.splice(0, this.messages.length);
	io.to(this.name).emit('room:messages-cleared', {name: this.name});
};

Room.prototype.delete = function() {
	io.to(this.name).emit('room:deleted', {name: this.name});

	var i, len;
	for (i = 0, len = this.clients.length; i < len; i++) {
		var socket = auth.getSocketByClientId(this.clients[i]._clientId);
		socket.leave(this.name);
	}

	this.clients.splice(0, this.clients.length);
};

Room.prototype.on = function(event, callback) {
	this.listeners[event] = this.listeners[event] || [];
	this.listeners[event].push(callback);
};

Room.prototype.trigger = function(event, data) {
	if (! this.listeners[event]) return;
	
	this.listeners[event].forEach(function(listener) {
		listener(data);
	});
};