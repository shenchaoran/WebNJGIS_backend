import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import { setting } from '../config/setting';
import DataCtrl from './data.controller';
import * as path from 'path'
import {
    calcuTaskDB,
    CalcuTaskState,
} from '../models';
import * as NodeCtrl from './computing-node.controller'
import { getByServer, postByServer, PostRequestType } from '../utils/request.utils';
import { ChildProcessUtil } from '../utils'
import MSRProgressDaemon from '../daemons/msrProgress.daemon'

export default class ModelServiceCtrl {
    constructor() { }

    /**
     * resolve:
     *      {msrId, code, desc}
     *      code:
     *          200: 调用成功
     *          500: 比较服务器出错
     *          501: 计算服务器出错
     *          503: 计算服务器崩了或 ip 变了
     * reject: 
     * 
     * 调用模型：
     *      插入运行记录
     *      如果 state === START_PENDING 时启动模型实例
     * 
     *      如果使用用户上传的数据时，还要先将数据传过去
     */
    static invoke(msr): Promise<any> {
        if (!msr._id) {
            msr._id = new ObjectID()
        }
        let node
        let serverURL
        return calcuTaskDB.upsert({ _id: msr._id }, msr)
            .then(rst => {
                if (CalcuTaskState.INIT === msr.state) {
                    return Promise.resolve(msr._id);
                }
                else if (CalcuTaskState.START_PENDING === msr.state) {
                    // 查找 node 的 host 和 port
                    return NodeCtrl.telNode(msr.ms.nodeId)
                        .then(v => {
                            serverURL = v
                            if (msr.IO.dataSrc === 'UPLOAD') {
                                return DataCtrl.pushData2ComputingServer(msr._id)
                            }
                            else {
                                return
                            }
                        })
                        .then(() => {
                            let invokeURL = `${serverURL}/services/invoke`
                            return postByServer(invokeURL, {
                                calcuTask: msr
                            }, PostRequestType.JSON)
                        })
                        .then(res => {
                            if (res.code === 200) {
                                // ModelServiceCtrl.progressDaemon(msr._id)
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 200,
                                    desc: 'start model succeed'
                                })
                            }
                            else {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 501,
                                    desc: 'start model failed, error in calculation server'
                                })
                            }
                        })
                        .catch(e => {
                            console.log(e);
                            if (_.get(e, 'error.code') === 'ECONNREFUSED') {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 503,
                                    desc: 'computing server crash or ip changed, please retry later'
                                })
                            }
                            else {
                                return Promise.resolve({
                                    msrId: msr._id,
                                    code: 500,
                                    desc: 'unpredectable error'
                                })
                            }
                        });
                }
            })
    }

    /**
     * deprecated
     */
    static progressDaemon(msrId) {
        let cpPath = path.join(__dirname, '../daemons/msrProgress.daemon.js')
        let cp = new ChildProcessUtil(cpPath)
        
        let debugFn = () => {
            let daemon = new MSRProgressDaemon (msrId)
            daemon.start()
                .then(msg => {
                    if((msg as any).code === 500) {
                        throw (msg as any).error
                    }
                    else if((msg as any).code === 200) {
                        console.info('fetch data succeed!')
                    }
                })
                .catch(e => {
                    console.log(e)

                })
        }
        
        cp.initialization(debugFn)
        //     .then(() => {
        //         cp.on(500)
        //             .then((msg) => {
        //                 console.log((msg as any).error)
        //             })

        //         cp.on(200)
        //             .then(() => {
        //                 console.log('fetch data succeed!')
        //             })

        //         cp.send({
        //             code: 'start',
        //             msrId: msrId
        //         })
        //     })
    }
}
