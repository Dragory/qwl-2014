var config = require('../config/config.json'),
	io;

module.exports = {
	boot: function() {
		io = require('./io');
		
		io.on('connection', function(socket) {
			require('./chat')(socket);
			require('./auth')(socket);
		});
	}
};