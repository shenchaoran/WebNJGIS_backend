import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const setting = {
    app: {
        name: 'WebNJGIS',
        version: 'v0.01'
    },
    auth: false,
    port: '9999',
    // session_secret: 'ashdfjhaxaskjfxfjksdjhflak',
    jwt_secret: 'asdl;fjl;asdjflasjkfsl;jfdl;asdfjl;asdjkflsda',
    platform: (function() {
        let platform = 1;
        if (os.type() == 'Linux') {
            platform = 2;
        }
        return platform;
    })(),
    mongodb: {
        // name: 'WebNJGIS',
        name: 'Comparison',
        host: '127.0.0.1',
        port: '27017'
    },
    calculation_server: {
        host: '172.21.213.146',
        port: '8060'
    },
    geo_data: {
        path: path.join(__dirname, '/../upload/geo-data')
    },
    geo_models: {
        path: path.join(__dirname, '/../upload/geo-models')
    },
    UDX: {
        parse: {
            maxSize: 10000
        }
    },
    debug: {
        child_process: true
    },
    invoke_failed_tag: '-----this is an error identification-----'
};