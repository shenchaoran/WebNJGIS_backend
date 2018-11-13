import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { ObjectID } from 'mongodb';
import * as mongoose from 'mongoose';

import { UDXCfg } from '../models/UDX-cfg.class';
import * as PropParser from './UDX.property.controller';
import * as UDXComparators from './UDX.compare.controller';
import CalcuTaskCtrl from './calcu-task.controller';
import ModelServiceCtrl from './model-service.controller';
import { CmpMethodFactory } from './cmp-methods';
import {
    taskDB,
    solutionDB,
    topicDB,
    modelServiceDB,
    calcuTaskDB,
    CalcuTask,
    CalcuTaskState,
    SchemaName,
    CmpState,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';

const db = taskDB;

export default class CmpTaskCtrl {
    constructor() { }
    async insert(doc: any) {
        return taskDB
            .insert(doc)
            .then(_doc => {
                return Bluebird.resolve(_doc._id);
            })
            .catch(Bluebird.reject);
    };

    async findByPage(pageOpt) {
        if (pageOpt.userId === undefined) {
            return db.findByPage({}, pageOpt)
                .then(rst => {
                    _.map(rst.docs, doc => {
                        this.reduceDoc(doc, '2');
                    });
                    return Bluebird.resolve(rst);
                })
                .catch(Bluebird.reject);
        } else {
            return db.findByUserId(pageOpt.userId).catch(Bluebird.reject);
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
            let task = await db.findOne({ _id: id })
            let solution = await solutionDB.findOne({ _id: task.solutionId });
            let ptMSs = await modelServiceDB.findByIds(solution.msIds);
            return { task, solution, ptMSs, }
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    };

    /**
     * 以不同力度缩减文档
     * 查询list时，level = 2，查询item 时，level = 1
     */
    private async reduceDoc(doc, level?: '1' | '2') {
        if (level === undefined || level === '1') {
            _.map(doc.cmpCfg.cmpObjs as any[], cmpObj => {
                _.map(cmpObj.dataRefers as any[], dataRefer => {
                    dataRefer.cmpResult = null
                })
            });
        }
        else if (level === '2') {
            doc.cmpResults = undefined;

            _.set(doc, 'cmpCfg.cmpObjs', undefined);
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
        return taskDB.findOne({ _id: taskId })
            .then(task => {
                _.map(task.cmpCfg.cmpObjs as any[], cmpObj => {
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
        return taskDB.findOne({ _id: cmpTaskId })
            .then(task => {
                // TODO
                _.map(task.cmpCfg.cmpObjs as any[], cmpObj => {
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
            console.log(e)
        }
    }

    private async startInBackground(cmpTaskId) {
        try {
            await taskDB.update({ _id: cmpTaskId }, {
                $set: {
                    state: CmpState.RUNNING
                }
            })
            let task = await taskDB.findOne({ _id: cmpTaskId });
            let solution = await solutionDB.findOne({ _id: task.solutionId });
            // start in background
            let calcuTasks = await Bluebird.map( task.calcuTaskIds as any[],
                calcuTaskId => {
                    return new Bluebird((resolve, reject) => {
                        let msCtrl = new ModelServiceCtrl()
                        msCtrl.on('afterDataBatchCached', ({ code }) => {
                            if (code === 200)
                                calcuTaskDB.findOne({ _id: calcuTaskId._id }).then(resolve)
                            else if (code === 500)
                                resolve(undefined)
                        })
                        msCtrl.invoke(calcuTaskId._id).catch(reject)
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
            await taskDB.update({ _id: task._id }, { $set: task })
            let promises = [];
            task.cmpObjs.map((cmpObj, i) => {
                cmpObj.methods.map((method, j) => {
                    promises.push(new Bluebird((resolve, reject) => {
                        // TODO 可能会出现并发问题
                        let cmpMethod = CmpMethodFactory(method.id, cmpObj.dataRefers, task.schemas)
                        cmpMethod.on('afterCmp', async resultFPath => {
                            try {
                                await taskDB.update({ _id: task._id }, {
                                    $set: { [`cmpObjs.${i}.methods.${j}.result`]: resultFPath }
                                })
                                resolve({ code: 200 })
                            }
                            catch (e) {
                                console.log(e);
                                resolve({ code: 500 })
                            }
                        })
                        cmpMethod.start();
                    }))
                })
            })
            Bluebird.all(promises).then(rsts => {
                let state = rsts.every(v => v.code === 200) ? CmpState.FINISHED_SUCCEED : CmpState.FINISHED_FAILED;
                taskDB.update({ _id: task }, {
                    $set: {
                        state: state
                    }
                })
            })
        }
        catch(e) {
            console.log(e);
        }
    }
}