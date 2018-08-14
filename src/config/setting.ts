import * as os from 'os';
import * as path from 'path';

export const setting = {
    auth: false,
    port: '9999',
    fiddler_proxy: {
        host: 'localhost',
        port: 3122,
        use: true
    },
    daemon: {
        msr_progress: 5000
    },
    session_secret: 'ashdfjhaxaskjfxfjksdjhflak',
    jwt_secret: 'asdl;fjl;asdjflasjkfsl;jfdl;asdfjl;asdjkflsda',
    platform: (function() {
        let platform = 1;
        if (os.type() == 'Linux') {
            platform = 2;
        }
        return platform;
    })(),
    mongodb: {
        name: 'Comparison',
        host: '192.168.1.131',
        port: '27017'
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
    // std output(实测数据)
    STD_DATA: {
        path: 'E:/Data/STD_Measured_Data'
    }
};