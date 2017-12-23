import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { ObjectID } from 'mongodb';
import * as mongoose from 'mongoose';

import { UDXCfg } from '../models/UDX-cfg.class';
import * as PropParser from './UDX.property.controller';
import * as UDXComparators from './UDX.compare.control';
import {
    cmpTaskDB,
    cmpSolutionDB,
    calcuTaskDB,
    CalcuTask,
    CalcuTaskState,
    SchemaName,
    CmpMethodEnum,
    CmpResultState,
    CmpState,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';
import * as ChildProcessCtrl from './child-process.controller';

export const convert2Tree = (user, docs: Array<any>): Promise<any> => {
    const trees = {
        public: [
            {
                type: 'root',
                label: "Earth's carbon cycle model",
                value: undefined,
                id: 'bbbbbbbbb',
                expanded: true,
                items: []
            }
        ],
        personal: undefined
    };
    const publicDocs = _.filter(docs, doc => doc.src === ResourceSrc.PUBLIC);
    let personalDocs = undefined;
    if (user && user.username !== 'Tourist') {
        trees.personal = [
            {
                type: 'root',
                label: "Earth's carbon cycle model",
                value: undefined,
                id: 'ccccccccccc',
                expanded: true,
                items: []
            }
        ];
        personalDocs = <Array<any>>_.filter(
            docs,
            doc => doc.auth.userId === user._id.toString()
        );
        if (personalDocs) {
            _.map(personalDocs, doc => {
                trees.personal[0].items.push({
                    type: 'leaf',
                    label: (<any>doc).meta.name,
                    value: doc,
                    id: (<any>doc)._id
                });
            });
        }
    }
    _.map(publicDocs, doc => {
        trees.public[0].items.push({
            type: 'leaf',
            label: doc.meta.name,
            value: doc,
            id: doc._id
        });
    });

    return Promise.resolve(trees);
};

export const start = (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB
            .find({ _id: id })
            .then(docs => {
                if (docs.length) {
                    const doc = docs[0];
                    return resolve(doc);
                } else {
                    return reject(new Error("Can't find this task!"));
                }
            })
            .then(doc => {
                // TODO
                insertCalcuTask(doc)
                    .then(_doc => {
                        return resolve();
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
};

export const insert = (doc: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB
            .insert(doc)
            .then(_doc => {
                return resolve(_doc);
            })
            .catch(reject);
    });
};

/**
 * 更新cmpTask的比较结果
 * 从dataRefer中取数据，如果该data没有做过cmp，就让他去参与比较，并将比较结果更新到数据库中
 */
export const updateCmpResult = (cmpTask: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        _.map(Array<any>(cmpTask.cmpCfg.cmpObjs), (cmpObj, i) => {
            const methods = [];
            _.map(Array<any>(cmpObj.methods), method => {
                if (method.checked === true) {
                    methods.push(method.value);
                }
            });
            if (methods.length !== 1) {
                return reject(new Error('invalidate comparison solution!'));
            }
            _.map(Array<any>(cmpObj.dataRefers), (dataRefer, j) => {
                if (dataRefer.dataId) {
                    let hasCreated = false;
                    _.find(Array<any>(cmpObj.cmpResults), cmpResult => {
                        if (cmpResult.dataId === dataRefer.dataId) {
                            hasCreated = true;
                        }
                    });
                    if (!hasCreated) {
                        // TODO 可能存在并发问题
                        // 可以通过 $each 解决，一次向数组中插入多个元素
                        const key = `cmpCfg.cmpObjs.${i}.cmpResults`;
                        const pushObj = {};
                        _.set(pushObj, key, {
                            dataId: dataRefer.dataId,
                            state: CmpResultState.PENDING
                        });
                        cmpTaskDB
                            .update(
                                {
                                    _id: cmpTask._id
                                },
                                {
                                    $push: pushObj,
                                    $set: {
                                        cmpState: 0
                                    }
                                }
                            )
                            .then(updateRst => {
                                if (updateRst.ok && updateRst.writeErrors.length === 0) {
                                    ChildProcessCtrl.newCmpProcess(dataRefer.dataId, methods)
                                        .then(cmpRst => {
                                            // TODO
                                            const findObj = {
                                                _id: cmpTask._id
                                            };
                                            _.set(
                                                findObj,
                                                `cmpCfg.cmpObjs.${i}.cmpResults.dataId`,
                                                dataRefer.dataId
                                            );
                                            const setObj = {};
                                            cmpRst.dataId = dataRefer.dataId;
                                            cmpRst.state = CmpResultState.SUCCEED;
                                            _.set(
                                                setObj,
                                                `cmpCfg.cmpObjs.${i}.cmpResults.$`,
                                                cmpRst
                                            );
                                            cmpTaskDB
                                                .update(findObj, {
                                                    $set: setObj
                                                })
                                                .then(updateRst => {
                                                    updateTaskState(cmpTask);
                                                    cmpTaskDB.update(findObj, cmpTask);
                                                    // if (
                                                    //     updateRst.ok &&
                                                    //     updateRst.writeErrors.length === 0
                                                    // ) {
                                                    // } else {
                                                    //     const setObj = {};
                                                    //     _.set(
                                                    //         setObj,
                                                    //         `cmpCfg.cmpObjs.${i}.cmpResults.$.state`,
                                                    //         CmpResultState.FAILED
                                                    //     );
                                                    //     cmpTaskDB.update(
                                                    //         findObj,
                                                    //         {
                                                    //             $set: setObj
                                                    //         }
                                                    //     );
                                                    //     console.log(
                                                    //         new Error(
                                                    //             'update comparison task failed'
                                                    //         )
                                                    //     );
                                                    // }
                                                });
                                        })
                                        .catch(err => {
                                            console.log(err);
                                        });
                                } else {
                                    console.log(
                                        new Error(
                                            'update comparison task failed'
                                        )
                                    );
                                }
                            })
                            .catch(console.log);
                    }
                }
            });
        });
    });
};

const parseRegion = (): Promise<any> => {
    return;
};

/**
 * 根据cmp-sln中涉及到的ms，插入calcu-task条目
 */
const insertCalcuTask = (taskDoc: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpSolutionDB
            .find({ _id: taskDoc.cmpCfg.solutionId })
            .then(docs => {
                if (docs.length) {
                    const solution = docs[0];
                    return Promise.resolve(solution);
                } else {
                    return reject(
                        new Error("can't find related comparison solution")
                    );
                }
            })
            .then(sln => {
                const msList = <Array<any>>sln.cfg.ms;
                const calcuTasks = _.map(msList, ms => {
                    if (taskDoc.calcuCfg.dataSrc === 'std') {
                        return {
                            _id: new ObjectID(),
                            msId: ms.msId,
                            cmpTaskId: taskDoc._id,
                            nodeName: ms.nodeName,
                            calcuCfg: taskDoc.calcuCfg,
                            state: CalcuTaskState.INIT
                        } as CalcuTask;
                    } else if (taskDoc.calcuCfg.dataSrc === 'upload') {
                        const calcuCfg = _.cloneDeep(taskDoc.calcuCfg);
                        calcuCfg.dataRefers = _.filter(
                            calcuCfg.dataRefers,
                            refer => {
                                return (<any>refer).msId === ms.msId;
                            }
                        );
                        return {
                            _id: new ObjectID(),
                            msId: ms.msId,
                            cmpTaskId: taskDoc._id,
                            nodeName: ms.nodeName,
                            calcuCfg: calcuCfg,
                            state: CalcuTaskState.INIT
                        } as CalcuTask;
                    }
                });
                return Promise.all(
                    _.map(calcuTasks, task => {
                        return new Promise((resolve, reject) => {
                            calcuTaskDB
                                .insert(task)
                                .then(calTask => {
                                    if (sln.calcuTasks === undefined) {
                                        sln.calcuTasks = [];
                                    }
                                    sln.calcuTasks.push({
                                        calcuTaskId: task._id,
                                        state: CalcuTaskState.INIT
                                    });
                                    return resolve(calTask);
                                })
                                .catch(reject);
                        });
                    })
                )
                    .then(rsts => {
                        return Promise.resolve(sln);
                    })
                    .catch(reject);
            })
            .then(sln => {
                cmpTaskDB
                    .insert(sln)
                    .then(_doc => {
                        return resolve(_doc);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
};

/**
 * 更新cmp-task的比较结果状态
 * 同步函数，没有保存到数据库中
 */
const updateTaskState = (cmpTask: any) => {
    const setIsRunning = () => {
        cmpTask.cmpState = CmpState.RUNNING;
    };
    // 有没有完成分为两部分：calcuTask-state, cmpResult-state
    _.map((cmpTask.calcuTasks) as Array<any>, calcuTask => {
            if(calcuTask.state === CalcuTaskState.INIT
                || calcuTask.state === CalcuTaskState.RUNNING
                || calcuTask.state === CalcuTaskState.START_PENDING
            ) {
                setIsRunning();
                return;
            }
    });
    _.map((cmpTask.cmpCfg.cmpObjs) as Array<any>, cmpObj => {
        _.map((cmpObj.cmpResults) as Array<any>, cmpResult => {
            if(cmpResult.state === CmpResultState.PENDING) {
                setIsRunning();
                return;
            }
        });
    });
}

/**
 * 更新cmpObj的dataRefer的dataId，更新的只是内存引用，没有保存到数据库中
 * 当calcu-task计算完成时调用
 * 同步函数
 */
export const updateDataRefer = (calcuTask, cmpTask) => {
    _.map(Array<any>(calcuTask.outputs), output => {
        _.map(cmpTask.cmpCfg.cmpObjs, cmpObj => {
            _.map(Array<any>((<any>cmpObj).dataRefers), dataRefer => {
                if(calcuTask.msId === dataRefer.msId && output.eventName === dataRefer.eventName) {
                    dataRefer.dataId = output.dataId;
                }
            })
        })
    });
    updateTaskState(cmpTask);
};