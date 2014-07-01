var config = require('../config/config.json');
module.exports = require('socket.io').listen(config.port);

console.log('Started listening on port ' + String(config.port));