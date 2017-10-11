let os = require('os');
let fs = require('fs');
let path = require('path');

module.exports = {
    version: 0.01,
    port: '9999',
    SESSION_SECRET: 'ashdfjhaxaskjfxfjksdjhflak',
    platform: (function() {
        let platform = 1;
        if (os.type() == 'Linux') {
            platform = 2;
        }
        return platform;
    })(),
    mongodb: {
        name: 'WebNJGIS',
        host: '127.0.0.1',
        port: '27017'
    }
};