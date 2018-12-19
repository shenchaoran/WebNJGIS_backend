import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import { setting } from '../config/setting';
import DataCtrl from './data.controller';
import * as path from 'path'
import {
    CalcuTaskModel,
    OGMSState,
    ModelServiceModel,
    StdDataModel,
    SolutionModel,
    MetricModel,
} from '../models';
import * as child_process from 'child_process';
import * as NodeCtrl from './computing-node.controller'
import { getByServer, postByServer, PostRequestType } from '../utils/request.utils';
// import { ChildProcessUtil } from '../utils'
import MSRProgressDaemon from '../daemons/msrProgress.daemon'
import * as EventEmitter from 'events'

export default class ModelServiceCtrl extends EventEmitter {
    constructor() {
        super()
    }

    /**
     * @returns 
     *      ARTICLE:
     *          READ:   { ms }
     *      SIDER:
     *          READ:   { ptTopic, ptSolutions, participants }
     *
     * @param {*} id
     * @param {('article' | 'sider')} type
     * @memberof SolutionCtrl
     */
    detailPage(id, type: 'ARTICLE' | 'SIDER', mode: 'READ' | 'WRITE') {

    }

    findOne(id) {
        return Bluebird.all([
            ModelServiceModel.findOne({ _id: id }) as any,
            StdDataModel.find({ 'models': id }) as any,
            SolutionModel.find({
                msIds: { $in: [id]}
            }),
            CalcuTaskModel.find({msId: id}).sort({ _id: -1 }).limit(5),
            MetricModel.find()
        ]).then(([ms, stds, solutions, calcuTasks, metrics]) => {

            return {
                ms,
                stds,
                solutions: _.chain(solutions).map(solution => _.pick(solution, ['_id', 'meta', 'auth'])).value(),
                calcuTasks: _.chain(calcuTasks).map(calcuTask => _.pick(calcuTask, ['_id', 'meta', 'auth'])).value(),
                metrics,
            };
        })
            .catch(e => {
                console.error(e);
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
                msr = await CalcuTaskModel.findOne({ _id: msr });
            else {
                if (!msr._id)
                    msr._id = new ObjectID()
                await CalcuTaskModel.upsert({ _id: msr._id }, msr);
            }

            if (OGMSState.INIT === msr.state)
                return {
                    msrId: msr._id,
                    code: 500,
                    desc: 'this calculation task is not ready to start!'
                };
            else if (OGMSState.COULD_START === msr.state) {
                // 查找 node 的 host 和 port
                let ms = await ModelServiceModel.findOne({ _id: msr.msId });
                let serverURL = await NodeCtrl.telNode(msr.nodeId)
                if (msr.IO.dataSrc === 'UPLOAD')
                    await new DataCtrl().pushData2ComputingServer(msr._id);
                let invokeURL = `${serverURL}/services/invoke`
                let res = await postByServer(invokeURL, {
                    calcuTask: msr
                }, PostRequestType.JSON)
                if (res.code === 200) {
                    // 监控运行进度，结束后主动将数据拉过来
                    this.progressDaemon(msr._id).then(msg => {
                        this.emit('onModelFinished', msg)
                        if ((msg as any).code === 200) {
                            let dataCtrl = new DataCtrl()
                            // 模型运行成功，且数据缓存成功
                            dataCtrl.on('afterDataBatchCached', msg => {
                                this.emit('afterDataBatchCached', msg)
                            })
                            dataCtrl.cacheDataBatch(msr._id)
                        }
                        // else if((msg as any).code === 500) {
                        //     // 模型运行失败
                        // }
                        // else{
                        //     // this.emit('afterDataBatchCached', { code: 500 })
                        // }
                    })
                        .catch(e => {
                            console.error(e);
                            this.emit('afterDataBatchCached', { code: 500 })
                        });

                    return {
                        msrId: msr._id,
                        code: 200,
                        desc: 'start model succeed'
                    };
                }
                else {
                    this.emit('onModelFinished', {code: 200})
                    return {
                        msrId: msr._id,
                        code: 501,
                        desc: 'start model failed, error in calculation server'
                    };
                }

            }
            else if (OGMSState.FINISHED_SUCCEED === msr.state) {
                this.emit('beforeModelInvoke', { code: 200 })
                return {
                    msrId: msr._id,
                    code: 200,
                    desc: 'this calculation task had already finished!'
                };
            }
        }
        catch (e) {
            console.error(e);
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
            console.error(e);
            return Bluebird.reject(e);
        }
    }

    public findByPages(pageOpt: {
        pageSize: number,
        pageIndex: number,
    }) {
        return ModelServiceModel.findByPages({}, pageOpt);
    }
}
