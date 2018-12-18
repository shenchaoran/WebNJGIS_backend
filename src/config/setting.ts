import * as os from 'os';
import * as path from 'path';

const debuge_mongodb_host = '192.168.139.1';
const release_mongodb_host = '223.2.43.23';

export const setting = {
    auth: false,
    API_prefix: '/CMIP-backend/api',
    port: 9999,
    fiddler_proxy: {
        host: 'localhost',
        port: 3122,
        use: false
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
        host: debuge_mongodb_host,
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
    invoke_failed_tag: '-----this is an error identification-----',
    progressReg: /-----Progress:(.*)%-----/,
    debug: {
        child_process: true
    },
    // std output(实测数据)
    STD_DATA: {
        path: 'E:/Data/STD_Measured_Data'
    },
    daemon: {
        msr_progress: 5000
    }
};