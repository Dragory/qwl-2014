var _ = require('lodash');

var permissions = {};

var globalDefaults = {
	canSendMessages: true,
	canCreateRooms: false,
	canDeleteRooms: false,
	canJoinRooms: true
};

/**
 * TODO: Save these in Redis.
 */

function init(clientId, defaultValues) {
	if (! permissions[clientId]) permissions[clientId] = {};
	if (! defaultValues) defaultValues = {};

	return _.defaults(permissions[clientId], defaultValues, globalDefaults);
}

function get(clientId) {
	return permissions[clientId] || {};
}

function add(clientId, permission) {
	permissions[clientId] = permissions[clientId] || {};
	permissions[clientId][permission] = true;
}

function remove(clientId, permission) {
	permissions[clientId] = permissions[clientId] || {};
	permissions[clientId][permission] = false;
}

function clear(clientId) {
	permissions[clientId] = {};
}

module.exports = {
	init: init,
	get: get,
	add: add,
	remove: remove,
	clear: clear
};