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
    calcuTaskDB,
    CalcuTask,
    CalcuTaskState,
    SchemaName,
    CmpState,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';

const db = taskDB;

export default class CmpTaskCtrl {
    task;
    cmpSln;
    calcuTasks;
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
            return db.findByUserId(pageOpt.userId).catch(Promise.reject);
        }

    }

    async getTaskDetail(id: string) {
        return db.findOne({ _id: id })
            .then(this.expandDoc.bind(this))
            .then(Bluebird.resolve)
            .catch(Bluebird.reject);
    };

    /**
     * 以不同力度缩减文档
     * 查询list时，level = 2，查询item 时，level = 1
     */
    private async reduceDoc(doc, level?: '1' | '2') {
        if (level === undefined || level === '1') {
            _.map(doc.cmpCfg.cmpObjs as any[], cmpObj => {
                _.map(cmpObj.dataRefers as any[], dataRefer => {
                    if (
                        dataRefer.cmpResult &&
                        dataRefer.cmpResult.chart &&
                        dataRefer.cmpResult.chart.state === CmpState.FINISHED_SUCCEED
                    ) {
                        // 数据量太大，这里单独请求
                        dataRefer.cmpResult.chart.tableSrc = undefined;
                    }
                })
            });
        }
        else if (level === '2') {
            doc.cmpResults = undefined;

            _.set(doc, 'cmpCfg.cmpObjs', undefined);
        }
        return doc;
    }

    private async expandDoc(doc) {
        // let calcuTaskPromise = undefined;
        // if (doc.calcuTaskIds && doc.calcuTaskIds.length) {
        //     calcuTaskPromise = Bluebird.all(_.map(doc.calcuTaskIds, id => {
        //         return calcuTaskDB.findOne({ _id: id });
        //     }));
        // }
        // return Bluebird.all([
        //     doc.topicId ?
        //         topicDB.findOne({ _id: doc.topicId }) : undefined,
        //     doc.solutionId ?
        //         solutionDB.findOne({ _id: doc.solutionId }) : undefined,
        //     calcuTaskPromise ?
        //         calcuTaskPromise : undefined
        // ])
        //     .then(rsts => {
        //         doc.topic = rsts[0];
        //         doc.solution = rsts[1];
        //         doc.calcuTasks = rsts[2];
        //         return Bluebird.resolve(doc);
        //     })
        //     .catch(Bluebird.reject);
        let cmpSln = await solutionDB.findOne({ _id: doc.solutionId });
        doc.participants = cmpSln.participants;
        return doc;
    }

    /**
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
            await taskDB.update({ _id: cmpTaskId }, {
                $set: {
                    state: CmpState.RUNNING
                }
            })
            this.task = await taskDB.findOne({ _id: cmpTaskId });
            this.cmpSln = await solutionDB.findOne({ _id: this.task.solutionId });
            // start in background
            Bluebird.map(this.task.calcuTaskIds as any[], calcuTaskId => {
                return new Promise((resolve, reject) => {
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
                {
                    concurrency: 10
                }
            )
                .then(async v => {
                    v = v.filter(v => !!v);
                    this.calcuTasks = v;
                    await this.updateCmpObjs();
                    let promises = [];
                    this.task.cmpObjs.map((cmpObj, i) => {
                        cmpObj.methods.map((method, j) => {
                            promises.push(new Promise((resolve, reject) => {
                                // TODO 可能会出现并发问题
                                let cmpMethod = CmpMethodFactory(method.id, cmpObj.dataRefers, this.task.schemas, {
                                    afterCmp: async () => {
                                        taskDB.update({
                                            _id: this.task._id
                                        }, {
                                                $set: {
                                                    [`cmpObjs.${i}.methods.${j}.result`]: cmpMethod.result
                                                }
                                            })
                                            .then(v => resolve({ code: 200 }))
                                            .catch(e => {
                                                console.log(e);
                                                resolve({ code: 500 })
                                            })
                                    }
                                })
                                cmpMethod.start();
                            }))
                        })
                        Bluebird.all(promises)
                            .then(rsts => {
                                let state = rsts.every(v => v.code === 200)? CmpState.FINISHED_SUCCEED: CmpState.FINISHED_FAILED;
                                taskDB.update({ _id: this.task }, {
                                    $set: {
                                        state: state
                                    }
                                })
                            })
                    })
                })
                .catch(e => {
                    console.log(e)
                })

            return Bluebird.resolve({
                code: 200,
                desc: 'Start comparison task in background!'
            });
        }
        catch (e) {
            console.log(e)
        }
    }

    private async updateCmpObjs() {
        this.task.cmpObjs.map(cmpObj => {
            cmpObj.dataRefers.map(dataRefer => {
                let msr = this.calcuTasks.find(msr => msr._id.toHexString() === dataRefer.msrId);
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
        return taskDB.update({ _id: this.task._id }, {
            $set: this.task
        })
    }
}