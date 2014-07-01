var Promise = require('bluebird'),
	_ = require('lodash');

var authConfig = require('../config/auth.json'),

	clientsBySocketId = {}, // Socket ID -> client info map
	clientsByClientId = {}, // Client ID -> client info map

	socketsByClientId = {};

var permissions = require('./permissions');

var baseClientInfo = {
	name: 'Unknown',
	permissions: {}
};

// Authenticates the client. Returns a promise.
function authenticate(socket, data) {
	var type, handler, info;

	// No auth type/name specified
	if (! data.type) {
		return Promise.reject(new Error('Auth type not specified.'));
	}

	type = data.type.toString();

	// Auth type/name not found/enabled
	if (! authConfig.enabled[type]) {
		return Promise.reject(new Error('Auth type not found.'));
	}

	try {
		handler = require(authConfig.enabled[type]);
		info = handler.info();
	} catch (e) {
		return Promise.reject(new Error('Auth handler could not be initialized.'));
	}

	// Attempt authentication
	handler.attempt(data)
		// Success
		.then(function(clientInfo) {
			// Make sure all base properties are present in client info
			_.defaults(clientInfo, baseClientInfo);

			var clientId = type + ':' + clientInfo.id;
			clientInfo._clientId = clientId;

			// Either initializes the client's permissions with the auth handler's values
			// or extends those values with permissions given earlier
			clientInfo.permissions = permissions.init(clientId, clientInfo.permissions);

			clientsByClientId[clientId]  = clientInfo;
			clientsBySocketId[socket.id] = clientInfo;
			socketsByClientId[clientId]  = socket;
		});
}

// "Deauthenticates" a client
function clear(socket) {
	var clientInfo = clientsBySocketId[socket.id];
	if (! clientInfo) return;

	delete clientsBySocketId[socket.id];
	delete clientsByClientId[clientInfo._clientId];
}

var toExport = function(io, socket) {
	socket.on('auth', function(data) {
		authenticate(socket, data)
			.then(function(clientInfo) {
				socket.emit('auth:success', clientInfo);
				io.emit('client:join-global', clientInfo);
			})
			.catch(function(err) {
				socket.emit('auth:fail');
			});
	});

	socket.on('disconnect', function() {
		clear(socket);
		io.emit('client:leave-global', clientInfo);
	});
};

toExport.getClientInfoForSocket = function(socket) {
	return clientsBySocketId[socket.id] || null;
};

toExport.getClientInfoForClientId = function(clientId) {
	return clientsByClientId[clientId] || null;
};

toExport.getClients = function() {
	var clients = [];

	for (var clientId in clientsByClientId) {
		clients.push(clientsByClientId[clientId]);
	}

	return clients;
};

toExport.getSocketByClientId = function(clientId) {
	return socketsByClientId[clientId] || null;
};

module.exports = toExport;