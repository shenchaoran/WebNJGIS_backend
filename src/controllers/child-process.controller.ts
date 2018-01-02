import * as http from 'http';
import * as net from 'net';
import * as child_process from 'child_process';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as UDXComparetor from './UDX.compare.controller';
import { setting } from '../config/setting';

const getPort = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.listen(0);
        server.on('listening', () => {
            const port = server.address().port;
            server.close();
            resolve(port); 
        });
    });
};

export const newCmpProcess = (dataId: string, methods: string[]): Promise<any> => {
    const cpPath = path.join(__dirname, 'UDX.compare.controller.js');
    return new Promise((resolve, reject) => {
        // 子进程不方便调试，所以如果调试模式下就不启用子进程，采用阻塞的方法在本进程运行。
        if(setting.debug.child_process) {
            UDXComparetor.compare(dataId, methods)
                .then(m => {
                    return resolve(m);
                })
                .catch(reject);
        }
        else {
            getPort()
                .then(port => {
                    const cp = child_process.fork(cpPath, [], {
                        execArgv: ['--inspect='+port]
                    });
                    cp.send({
                        code: 'start',
                        dataId: dataId,
                        methods: methods
                    });
                    cp.on('message', m => {
                        if(m.code === 'kill') {
                            cp.kill();
                            return resolve(m.data);
                        }
                    });
                })
                .catch(reject);
        }
    })
};