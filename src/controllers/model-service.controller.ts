import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import { setting } from '../config/setting';
import DataCtrl from './data.controller';
import * as path from 'path'
import {
    calcuTaskDB,
    CalcuTaskState,
    modelServiceDB,
    stdDataDB,
} from '../models';
import * as child_process from 'child_process';
import * as NodeCtrl from './computing-node.controller'
import { getByServer, postByServer, PostRequestType } from '../utils/request.utils';
// import { ChildProcessUtil } from '../utils'
import MSRProgressDaemon from '../daemons/msrProgress.daemon'
import * as EventEmitter from 'events'

export default class ModelServiceCtrl extends EventEmitter {
    db = modelServiceDB;
    constructor() {
        super()
    }

    findOne(id) {
        return Bluebird.all([
            this.db.findOne({ _id: id }),
            stdDataDB.find({ 'models': id }),
        ]).then(([ms, stds]) => {
            return {
                ms,
                stds,
            };
        })
            .catch(e => {
                console.log(e);
                Bluebird.reject(e);
            })
    }

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
     *      如果 state === COULD_START 时启动模型实例
     * 
     *      如果使用用户上传的数据时，还要先将数据传过去
     */
    invoke(msr);
    invoke(msrId: string);
    async invoke(msr) {
        try {
            if (typeof msr === 'string')
                msr = await calcuTaskDB.findOne({ _id: msr });
            else {
                if (!msr._id)
                    msr._id = new ObjectID()
                await calcuTaskDB.upsert({ _id: msr._id }, msr);
            }

            if (CalcuTaskState.INIT === msr.state)
                return {
                    msrId: msr._id,
                    code: 500,
                    desc: 'this calculation task is not ready to start!'
                };
            else if (CalcuTaskState.COULD_START === msr.state) {
                // 查找 node 的 host 和 port
                let ms = await modelServiceDB.findOne({ _id: msr.msId });
                let serverURL = await NodeCtrl.telNode(ms.nodeId)
                if (msr.IO.dataSrc === 'UPLOAD')
                    await new DataCtrl().pushData2ComputingServer(msr._id);
                let invokeURL = `${serverURL}/services/invoke`
                let res = await postByServer(invokeURL, {
                    calcuTask: msr
                }, PostRequestType.JSON)
                if (res.code === 200) {
                    // 监控运行进度，结束后主动将数据拉过来
                    this.progressDaemon(msr._id).then(msg => {
                        if ((msg as any).code === 200) {
                            let dataCtrl = new DataCtrl()
                            dataCtrl.on('afterDataBatchCached', () => this.emit('afterDataBatchCached', { code: 200 }))
                            dataCtrl.cacheDataBatch(msr._id)
                        }
                        else
                            this.emit('afterDataBatchCached', { code: 500 })
                    })
                        .catch(e => {
                            console.log(e);
                            this.emit('afterDataBatchCached', { code: 500 })
                        });

                    return {
                        msrId: msr._id,
                        code: 200,
                        desc: 'start model succeed'
                    };
                }
                else {
                    this.emit('afterDataBatchCached', { code: 500 })
                    return {
                        msrId: msr._id,
                        code: 501,
                        desc: 'start model failed, error in calculation server'
                    };
                }

            }
            else if (CalcuTaskState.FINISHED_SUCCEED === msr.state) {
                this.emit('afterDataBatchCached', { code: 200 })
                return {
                    msrId: msr._id,
                    code: 200,
                    desc: 'this calculation task had already finished!'
                };
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

    private async progressDaemon(msrId) {
        try {
            if (setting.debug.child_process) {
                let daemon = new MSRProgressDaemon(msrId)
                let msg = await daemon.start()
                return msg;
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
                    return Bluebird.resolve(msg);
                });
            }
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    }

    public findByPage(pageOpt: {
        pageSize: number,
        pageIndex: number,
    }) {
        return this.db.findByPage({}, pageOpt);
    }
}
