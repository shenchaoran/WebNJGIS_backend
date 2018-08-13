import * as os from 'os';
import * as fs from 'fs';
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
    invoke_failed_tag: '-----this is an error identification-----',
    progressReg: /-----Progress:(.*)%-----/,
    STD_DATA: {
        IBIS_STD_DATA: {
            inputPath: 'E:\\Data\\IBIS_Data\\input',
            outputPath: 'E:\\Data\\IBIS_Data\\output'
        },
        BIOME_BGC_STD_DATA: {
            inputPath: 'E:\\Data\\Biome_BGC_Data',
            outputPath: 'E:\\Data\\Biome_BGC_Data\\outputs'
        }
    }
};