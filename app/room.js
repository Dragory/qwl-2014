var _ = require('lodash');

function objValues(obj) {
	var vals = [];

	for (var prop in obj) {
		if (! obj.hasOwnProperty(prop)) continue;
		vals.push(obj[prop]);
	}

	return vals;
}

function Room(name) {
	this.name = name;
	this.messages = [];
	this.admins   = {}; // Admins indexed by clientId
	this.clients  = {}; // Clients indexed by clientId

	this.messageId = 1;

	this.listeners = {};
}

Room.prototype.getInfo = function() {
	return {
		name: name,
		admins: objValues(this.admins),
		clients: objValues(this.clients)
	};
};

Room.prototype.addClient = function(clientInfo) {
	if (this.clients[clientInfo._clientId]) return;
	this.clients[clientInfo._clientId] = clientInfo;

	this.emit('client-added', {client: clientInfo});
};

Room.prototype.removeClient = function(clientInfo) {
	if (! this.clients[clientInfo._clientId]) return;
	delete this.clients[clientInfo._clientId];

	this.emit('client-removed', {client: clientInfo});
};

Room.prototype.hasClient = function(clientInfo) {
	return (typeof this.clients[clientInfo._clientId] !== 'undefined');
};

Room.prototype.addAdmin = function(clientInfo) {
	if (this.admins[clientInfo._clientId]) return;
	this.admins[clientInfo._clientId] = clientInfo;

	this.emit('admin-added', {admin: clientInfo});
};

Room.prototype.removeAdmin = function(clientInfo) {
	if (! this.admins[clientInfo._clientId]) return;
	delete this.admins[clientInfo._clientId];

	this.emit('admin-removed', {admin: clientInfo});
};

Room.prototype.hasAdmin = function(clientInfo) {
	return (typeof this.admins[clientInfo._clientId] !== 'undefined');
};

Room.prototype.sendMessage = function(clientInfo, message) {
	var messageObj = {
		id: this.messageId++,
		client: clientInfo,
		message: message
	};

	this.messages.push(messageObj);
	this.emit('new-message', {message: message});
};

Room.prototype.getMessages = function(num, start) {
	num = parseInt(num, 10);
	start = parseInt(start, 10);

	if (num <= 0) return [];
	if (start <= 0) start = 0;

	return this.messages.slice(-1 * start - num, -1 * start);
};

Room.prototype.clearMessages = function() {
	this.messages.splice(0, this.messages.length);
	this.emit('messages-cleared');
};

Room.prototype.delete = function() {
	this.emit('room-deleted');
	this.clients.splice(0, this.clients.length);
	this.admins.splice(0, this.admins.length);
};

/**
 * Events
 */

Room.prototype.on = function(event, callback) {
	this.listeners[event] = this.listeners[event] || [];
	this.listeners[event].push(callback);
};

Room.prototype.emit = function(event, data) {
	if (! this.listeners[event]) return;

	this.listeners[event].forEach(function(listener) {
		listener(data);
	});
};