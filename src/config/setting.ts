import * as os from 'os';
import * as path from 'path';

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
        host: 'localhost',
        port: '27017'
    },
    geo_data: {
        path: path.join(__dirname, '/../upload/geo-data')
    },
    obs_data: {
        path: '/home/scr/Data/Fluxdata/refactored'
    },
    invoke_failed_tag: '-----this is an error identification-----',
    progressReg: /-----Progress:(.*)%-----/,
    debug: {
        child_process: true
    },
    daemon: {
        msr_progress: 5000
    },
    // 缓存的结果文件夹
    STD_DATA: {
        // 'IBIS_2.6b4': '/home/scr/STD_DATA/IBIS_2.6b4',
        'IBIS site': '/home/scr/Data/IBIS_Data',
        'Biome-BGC site': '/home/scr/Data/Biome_BGC_Data',
        'LPJ site': '/home/scr/Data/LPJ',
        'IBIS global': '',              // 这个标准数据集存在上传文件夹中
        'Biome-BGC global': '',         // 这个标准数据集存在上传文件夹中
    }
};
