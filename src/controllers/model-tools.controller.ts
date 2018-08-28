import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import { setting } from '../config/setting';
import DataCtrl from './data.controller';
import * as path from 'path'
import {
    calcuTaskDB,
    CalcuTaskState,
} from '../models';
import * as child_process from 'child_process';
import * as NodeCtrl from './computing-node.controller'
import { getByServer, postByServer, PostRequestType } from '../utils/request.utils';
// import { ChildProcessUtil } from '../utils'
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
    static invoke(msr);
    static invoke(msrId: string);
    static async invoke(msr) {
        try {
            if (typeof msr === 'string') {
                msr = await calcuTaskDB.findOne({ _id: msr });
            }
            else {
                if (!msr._id) {
                    msr._id = new ObjectID()
                }
            }

            await calcuTaskDB.upsert({ _id: msr._id }, msr);
            if (CalcuTaskState.INIT === msr.state) {
                return msr._id;
            }
            else if (CalcuTaskState.START_PENDING === msr.state) {
                // 查找 node 的 host 和 port
                let serverURL = await NodeCtrl.telNode(msr.ms.nodeId)
                if (msr.IO.dataSrc === 'UPLOAD') {
                    await DataCtrl.pushData2ComputingServer(msr._id);
                }
                let invokeURL = `${serverURL}/services/invoke`
                let res = await postByServer(invokeURL, {
                    calcuTask: msr
                }, PostRequestType.JSON)
                if (res.code === 200) {
                    // 监控运行进度，结束后主动将数据拉过来
                    ModelServiceCtrl.progressDaemon(msr._id)
                        .then(msg => {
                            if((msg as any).code === 200)
                                DataCtrl.cacheDataBatch(msr._id)
                        })
                        .catch(e => {
                            console.log(e);
                        })

                    return {
                        msrId: msr._id,
                        code: 200,
                        desc: 'start model succeed'
                    };
                }
                else {
                    return {
                        msrId: msr._id,
                        code: 501,
                        desc: 'start model failed, error in calculation server'
                    };
                }

            }
        }
        catch (e) {
            console.log(e);
            if (_.get(e, 'error.code') === 'ECONNREFUSED') {
                return {
                    msrId: msr._id,
                    code: 503,
                    desc: 'computing server crash or ip changed, please retry later'
                }
            }
            else {
                return {
                    msrId: msr._id,
                    code: 500,
                    desc: 'unpredectable error'
                }
            }
        };
    }

    static async progressDaemon(msrId) {
        return new Bluebird((resolve, reject) => {
            if (setting.debug.child_process) {
                let daemon = new MSRProgressDaemon(msrId)
                daemon.start()
                    .then(msg => {
                        resolve(msg)
                    })
                    .catch(e => {
                        console.log(e);
                        reject(e)
                    })
            }
            else {
                let cpPath = path.join(__dirname, '../daemons/msrProgress.daemon.js')
                let cp = child_process.fork(cpPath, []);
                cp.send({
                    code: 'start',
                    msrId: msrId
                });
                cp.on('message', msg => {
                    cp.kill();
                    return resolve(msg);
                });
            }
        });
    }
}
