var config = require('../config/config.json'),
	io = require('socket.io').listen(config.port);

io.on('connection', function(socket) {
	require('./auth')(io, socket);
	require('./chat')(io, socket);
});