import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));
import { setting } from '../config/setting';
import { ObjectID } from 'mongodb';
import * as mongoose from 'mongoose';

import { UDXCfg } from '../models/UDX-cfg.class';
import CalcuTaskCtrl from './calcu-task.controller';
import ModelServiceCtrl from './model-service.controller';
import { CmpMethodFactory } from './cmp-methods';
import {
    TaskModel,
    SolutionModel,
    TopicModel,
    ModelServiceModel,
    CalcuTaskModel,
    ICalcuTaskDocument,
    CalcuTaskState,
    SchemaName,
    CmpState,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';

export default class CmpTaskCtrl {
    constructor() { }
    async insert(doc: any) {
        return TaskModel
            .insert(doc)
            .then(_doc => {
                return Bluebird.resolve(_doc._id.toString());
            })
            .catch(Bluebird.reject);
    };

    async findByPages(pageOpt) {
        if (pageOpt.userId === undefined) {
            return TaskModel.findByPages({}, pageOpt)
                .then(rst => {
                    _.map(rst.docs, doc => {
                        this.reduceDoc(doc, '2');
                    });
                    return Bluebird.resolve(rst);
                })
                .catch(Bluebird.reject);
        } else {
            return TaskModel.findByUserId(pageOpt.userId).catch(Bluebird.reject);
        }

    }

    /**
     * @returns 
     *      ARTICLE:
     *          READ:   { task, solution, ptMSs }
     *          WRITE:  { mss, methods }
     *      SIDER:
     *          READ:   { ptTopic, ptTasks, participants }
     *          WRITE:  { topics }
     *
     * @param {*} id
     * @param {('article' | 'sider')} type
     * @memberof SolutionCtrl
     */
    detailPage(id, type: 'ARTICLE' | 'SIDER', mode: 'READ' | 'WRITE') {

    }

    async findOne(id: string) {
        try {
            // TODO 数据库设计 及 异步流程控制
            let task = await TaskModel.findOne({ _id: id })
            let solution = await SolutionModel.findOne({ _id: task.solutionId });
            let ptMSs = await ModelServiceModel.findByIds(solution.msIds);
            for(let cmpObj of task.cmpObjs) {
                for( let method of cmpObj.methods) {
                    if(method.result) {
                        let opt = await fs.readFileAsync(path.join(setting.geo_data.path, method.result), 'utf8')
                        method.result = JSON.parse(opt);
                    }
                }
            }
            return { task, solution, ptMSs, }
        }
        catch (e) {
            console.error(e);
            return Bluebird.reject(e);
        }
    };

    /**
     * 以不同力度缩减文档
     * 查询list时，level = 2，查询item 时，level = 1
     */
    private async reduceDoc(doc, level?: '1' | '2') {
        if (level === undefined || level === '1') {
            _.map(doc.cmpObjs as any[], cmpObj => {
                _.map(cmpObj.dataRefers as any[], dataRefer => {
                    dataRefer.cmpResult = null
                })
            });
        }
        else if (level === '2') {
            doc.cmpResults = undefined;

            _.set(doc, 'cmpObjs', undefined);
        }
        return doc;
    }

    /**
     * deprecated
     * 根据taskId和请求的数据类型返回cmp-data的详情
     * 没有直接放在task中是因为太大了
     */
    async getCmpResult(taskId, cmpObjId, msId) {
        let cmpRst;
        return TaskModel.findOne({ _id: taskId })
            .then(task => {
                _.map(task.cmpObjs as any[], cmpObj => {
                    if (cmpObj.id === cmpObjId) {
                        _.map(cmpObj.dataRefers as any[], dataRefer => {
                            if (dataRefer.msId === msId) {
                                if (dataRefer.cmpResult) {
                                    cmpRst = {
                                        cmpObjId: cmpObj.id,
                                        msId: dataRefer.msId,
                                        done: true,
                                        cmpResult: dataRefer.cmpResult
                                    };
                                }
                                else {
                                    cmpRst = {
                                        cmpObjId: cmpObj.id,
                                        msId: dataRefer.msId,
                                        done: false
                                    };
                                }
                            }
                        });
                    }
                });
                return Bluebird.resolve(cmpRst);
            })
            .catch(Bluebird.reject);
    };


    /**
     * 返回标准结果，目前没有标准结果集，只能返回和计算结果相同的数据
     *      table数据返回table
     *      ascii grid 数据返回 cmpResult-> image里的结构
     *      statistic 返回 hot table 的数据源
     */
    async getStdResult(cmpTaskId) {
        const stdResult = [];
        return TaskModel.findOne({ _id: cmpTaskId })
            .then(task => {
                // TODO
                _.map(task.cmpObjs as any[], cmpObj => {
                    _.map(cmpObj.methods as any[], method => {

                    });
                });

            })
            .catch(Bluebird.reject);
    }

    async start(cmpTaskId) {
        try {
            this.startInBackground(cmpTaskId);
            return Bluebird.resolve({
                code: 200,
                desc: 'Start comparison task in background!'
            });
        }
        catch (e) {
            console.error(e)
        }
    }

    private async startInBackground(cmpTaskId) {
        try {
            await TaskModel.updateOne({ _id: cmpTaskId }, {
                $set: {
                    state: CmpState.RUNNING
                }
            })
            let task = await TaskModel.findOne({ _id: cmpTaskId });
            // let solution = await SolutionModel.findOne({ _id: task.solutionId });
            let calcuTasks = await Bluebird.map( task.calcuTaskIds,
                calcuTaskId => {
                    return new Bluebird((resolve, reject) => {
                        let msCtrl = new ModelServiceCtrl()
                        msCtrl.on('afterDataBatchCached', ({ code }) => {
                            if (code === 200)
                                return CalcuTaskModel.findOne({ _id: calcuTaskId }).then(resolve)
                            else if (code === 500)
                                resolve(undefined)
                        })
                        msCtrl.on('onModelFinished', ({code}) => {
                            if(code === 500) {
                                resolve(undefined)
                            }
                        })

                        msCtrl.invoke(calcuTaskId).catch(reject)
                    })
                },
                { concurrency: 10 }
            )
            calcuTasks = calcuTasks.filter(v => !!v);
            // updateCmpObjs
            task.cmpObjs.map(cmpObj => {
                cmpObj.dataRefers.map(dataRefer => {
                    let msr = (calcuTasks as any[]).find(msr => msr._id.toHexString() === dataRefer.msrId);
                    if (msr)
                        for (let key in msr.IO) {
                            if (key === 'inputs' || key === 'outputs' || key === 'parameters') {
                                let event = msr.IO[key].find(event => event.id === dataRefer.eventId)
                                if (event)
                                    dataRefer.value = event.value
                            }
                        }
                })
            })
            await TaskModel.updateOne({ _id: task._id }, { $set: task })
            let promises = [];
            task.cmpObjs.map((cmpObj, i) => {
                cmpObj.methods.map((method, j) => {
                    promises.push(new Bluebird((resolve, reject) => {
                        // TODO 可能会出现并发问题
                        let cmpMethod = CmpMethodFactory((method as any).name, cmpObj.dataRefers, task.schemas, cmpObj.regions)
                        cmpMethod.on('afterCmp', async resultFPath => {
                            try {
                                await TaskModel.updateOne({ _id: task._id }, {
                                    $set: { [`cmpObjs.${i}.methods.${j}.result`]: resultFPath }
                                })
                                resolve({ code: 200 })
                            }
                            catch (e) {
                                console.error(e);
                                resolve({ code: 500 })
                            }
                        })
                        cmpMethod.start();
                    }))
                })
            })
            Bluebird.all(promises).then(rsts => {
                // let state = rsts.every(v => v.code === 200) ? CmpState.FINISHED_SUCCEED : CmpState.FINISHED_FAILED;
                TaskModel.updateOne({ _id: task }, {
                    $set: {
                        state: CmpState.FINISHED_SUCCEED
                    }
                })
                .then(console.log)
            })
        }
        catch(e) {
            console.error(e);
        }
    }
}