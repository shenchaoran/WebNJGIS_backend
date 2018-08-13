import * as http from 'http';
import * as net from 'net';
import * as child_process from 'child_process';
// import * as Promise from 'bluebird';
import * as path from 'path';
import { setting } from '../config/setting';

export class ChildProcessUtil {
    cp
    constructor(private cpPath) {

    }

    private getPort() {
        return new Promise((resolve, reject) => {
            const server = http.createServer();
            server.listen(0);
            server.on('listening', () => {
                const port = server.address().port;
                server.close();
                resolve(port);
            });
        });
    }

    public async initialization(debugFn) {
        // 子进程不方便调试，所以如果调试模式下就不启用子进程，采用阻塞的方法在本进程运行。
        if (setting.debug.child_process) {
            debugFn()
        }
        else {
            try {
                // let port = await this.getPort()
                let port = 34835
                console.log('child_process port: ' + port)
                this.cp = child_process.fork(this.cpPath, [], {
                    execArgv: ['--inspect=' + port]
                })
            }
            catch (e) {
                throw e
            }
        }
    }

    public send(msg) {
        this.cp.send(msg)
    }

    public async on(event) {
        try {
            return await new Promise((resolve, reject) => {
                this.cp.on('message', m => {
                    if(m.code === event)
                        return resolve(m)
                }) 
            })
        }
        catch(e) {
            throw e
        }
    }

    public kill() {
        try {
            this.cp.kill()
        }
        catch(e) {
            throw e
        }
    }
}