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
import * as UDXComparators from './UDX.compare.controller';
import {
    cmpTaskDB,
    cmpSolutionDB,
    calcuTaskDB,
    CalcuTask,
    CalcuTaskState,
    SchemaName,
    CmpMethodEnum,
    CmpState,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';
import * as ChildProcessCtrl from './child-process.controller';

export const findAll = (user): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB
            .find({})
            .then(docs => {
                docs = _.map(docs as any[], doc => {
                    return reduceDoc(doc._doc, '2');
                });
                return Promise.resolve(docs);
            })
            .then(docs => {
                return convert2Tree(user, docs);
            })
            .then(resolve)
            .catch(reject);
    });
}

export const findOne = (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB.findOne({_id: id})
            .then(doc => {
                doc = reduceDoc(doc._doc, '1');
                return resolve(doc);
            })
            .catch(reject);
    });
}

const reduceDoc = (doc, level?: '1' | '2') => {
    if(level === undefined || level === '1') {
        _.map(doc.cmpCfg.cmpObjs as any[], cmpObj => {
            _.map(cmpObj.dataRefers as any[], dataRefer => {
                if(
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
    else if(level === '2') {
        doc.cmpCfg.cmpObjs = undefined;
    }
    return doc;
}

export const getCmpResult = (taskId, rstType): Promise<any> => {
    return new Promise((resolve, reject) => {
        
    });
};
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
                    return Promise.resolve(doc);
                } else {
                    return Promise.reject(new Error("Can't find this task!"));
                }
            })
            .then(doc => {
                // TODO 没有管then
                updateCmpResult(doc._id);
                insertCalcuTask(doc)
                    .then(() => {
                        return resolve();
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
};

export const insert = (doc: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        doc = changeParticipate(doc);
        cmpTaskDB
            .insert(doc)
            .then(_doc => {
                return resolve(_doc);
            })
            .catch(reject);
    });
};

// cmp-task.cmpCfg.ms.participate属性不准，这里根据比较对象是否需要计算得到，来更新该字段
const changeParticipate = (cmpTask: any) => {
    _.map(cmpTask.cmpCfg.ms as Array<any>, ms => {
        ms.participate = false;
        _.map(cmpTask.cmpCfg.cmpObjs as Array<any>, cmpObj => {
            _.map(cmpObj.dataRefers as Array<any>, dataRefer => {
                if(ms.participate === false) {
                    if(dataRefer.msId === ms.msId) {
                        if(
                            dataRefer.eventName !== '' && 
                            dataRefer.eventName !== undefined &&
                            (dataRefer.dataId === undefined || dataRefer.dataId === '')
                        ) {
                            ms.participate = true;
                        }
                    }
                }
            });
        });
    });
    return cmpTask;
}

/**
 * 开始比较的入口
 * 更新cmpTask的比较结果
 * 从dataRefer中取数据，如果该data没有做过cmp，就让他去参与比较，并将比较结果更新到数据库中
 * 在两处调用：
 *      calculate-task计算完成后，开始计算结果的比较；
 *      start cmp-task时，开始上传数据的比较
 */
export const updateCmpResult = (cmpTaskId: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB.findOne({_id: cmpTaskId})
            .then(cmpTask => {
                _.map(cmpTask.cmpCfg.cmpObjs as Array<any>, (cmpObj, i) => {
                    if (cmpObj.methods.length < 1) {
                        return reject(new Error('invalidate comparison solution!'));
                    }
                    _.map(cmpObj.dataRefers as Array<any>, (dataRefer, j) => {
                        if (dataRefer.dataId) {
                            if (
                                dataRefer.cmpResult === undefined ||
                                dataRefer.cmpResult.state === undefined ||
                                dataRefer.cmpResult.state === CmpState.INIT
                            ) {
                                // TODO 可能存在并发问题
                                // 可以通过 $each 解决，一次向数组中插入多个元素
                                const key = `cmpCfg.cmpObjs.${i}.dataRefers.${j}.cmpResult`;
                                const setObj = {};
                                setObj[key] = { state: CmpState.RUNNING };
                                setObj['cmpState'] = CmpState.RUNNING;
                                // TODO 这里其实可以用一次更新就行了
                                cmpTaskDB
                                    .update(
                                        {
                                            _id: cmpTask._id
                                        },
                                        {
                                            $set: setObj
                                        }
                                    )
                                    .then(updateRst => {
                                        ChildProcessCtrl.newCmpProcess(
                                            dataRefer.dataId,
                                            cmpObj.methods
                                        )
                                            .then(cmpRst => {
                                                // TODO
                                                const setObj = {};
                                                setObj[key] = {
                                                    state: CmpState.FINISHED,
                                                    image: cmpRst.image,
                                                    chart: cmpRst.chart,
                                                    GIF: cmpRst.GIF,
                                                    statistic: cmpRst.statistic
                                                };
                                                cmpTaskDB.update(
                                                    {
                                                        _id: cmpTask._id
                                                    }, 
                                                    {
                                                        $set: setObj
                                                    }
                                                )
                                                    .then(updateRst => {
                                                        updateTaskState(cmpTask._id);
                                                    });
                                            });
                                            // 此处不会出现reject
                                            // .catch(err => {
                                            //     console.log(err);
                                            // });
                                    })
                                    .catch(console.log);
                            }
                        }
                    });
                });
            })
            .catch(reject);
    });
};

const parseRegion = (): Promise<any> => {
    return;
};

/**
 * 根据cmp-sln中涉及到的ms，插入calcu-task条目
 */
const insertCalcuTask = (cmpTask: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        const calcuTasks = [];
        _.map((cmpTask.cmpCfg.ms) as Array<any>, ms => {
            if (ms.participate) {
                if (cmpTask.calcuCfg.dataSrc === 'std') {
                    calcuTasks.push({
                        _id: new ObjectID(),
                        msId: ms.msId,
                        cmpTaskId: cmpTask._id,
                        nodeName: ms.nodeName,
                        calcuCfg: cmpTask.calcuCfg,
                        state: CalcuTaskState.INIT
                    } as CalcuTask);
                } else if (cmpTask.calcuCfg.dataSrc === 'upload') {
                    const calcuCfg = _.cloneDeep(cmpTask.calcuCfg);
                    calcuCfg.dataRefers = _.filter(
                        calcuCfg.dataRefers,
                        refer => {
                            return (<any>refer).msId === ms.msId;
                        }
                    );
                    calcuTasks.push({
                        _id: new ObjectID(),
                        msId: ms.msId,
                        cmpTaskId: cmpTask._id,
                        nodeName: ms.nodeName,
                        calcuCfg: calcuCfg,
                        state: CalcuTaskState.INIT
                    } as CalcuTask);
                }
            }
        });
        return Promise.all(
            _.map(calcuTasks, task => {
                return new Promise((resolve, reject) => {
                    calcuTaskDB
                        .insert(task)
                        .then(calTask => {
                            if (cmpTask.calcuTasks === undefined) {
                                cmpTask.calcuTasks = [];
                            }
                            cmpTask.calcuTasks.push({
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
                return resolve();
            })
            .catch(reject);
    });
};

/**
 * 更新cmpState 字段
 */
export const updateTaskState = (cmpTaskId: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return cmpTaskDB.findOne({_id: cmpTaskId})
            .then(cmpTask => {
                let state = CmpState.RUNNING;
                // 有没有完成分为两部分：calcuTask-state, cmpResult-state
                let allFinished = true;
                _.map(cmpTask.calcuTasks as Array<any>, calcuTask => {
                    if(allFinished) {
                        if (
                            calcuTask.state !== CalcuTaskState.FINISHED_FAILED &&
                            calcuTask.state !== CalcuTaskState.FINISHED_SUCCEED
                        ) {
                            allFinished = false;
                        }
                    }
                });
                if(allFinished) {
                    _.map(cmpTask.cmpCfg.cmpObjs as Array<any>, cmpObj => {
                        _.map(cmpObj.dataRefers as Array<any>, dataRefer => {
                            if(allFinished) {
                                if(
                                    dataRefer.cmpResult === undefined ||
                                    dataRefer.cmpResult.state !== CmpState.FINISHED
                                ) {
                                    allFinished = false;
                                }
                            }
                        });
                    });
                }
                
                if(allFinished) {
                    state = CmpState.FINISHED;
                }
                else {
                    state = CmpState.RUNNING;
                }
                return Promise.resolve(state);
            })
            .then(state => {
                return cmpTaskDB.update(
                    {
                        _id: cmpTaskId
                    },
                    {
                        $set: {
                            cmpState: state
                        }
                    }
                );
            })
            .catch(reject);
    });
};

/**
 * 更新cmpObj的dataRefer的dataId 字段
 * 当calcu-task计算完成时调用
 */
export const updateDataRefer = (calcuTask): Promise<any> => {
    const cmpTaskId = calcuTask.cmpTaskId;
    return new Promise((resolve, reject) => {
        return cmpTaskDB.findOne({_id: cmpTaskId})
            .then(cmpTask => {
                const setObj = {};
                _.map((calcuTask.outputs) as Array<any>, output => {
                    _.map((cmpTask.cmpCfg.cmpObjs) as Array<any>, (cmpObj, i) => {
                        _.map((cmpObj.dataRefers) as Array<any>, (dataRefer, j) => {
                            if(
                                dataRefer.msId === calcuTask.msId &&
                                dataRefer.eventName === output.eventName
                            ) {
                                setObj[`cmpCfg.cmpObjs.${i}.dataRefers.${j}.dataId`] = output.dataId;
                            }
                        });
                    });
                });
                cmpTaskDB.update(
                    {
                        _id: cmpTaskId
                    }, 
                    {
                        $set: setObj
                    }
                )
                    .then(updateRst => {
                        return resolve();
                    })
                    .catch(e => {
                        return reject(e);
                    });
            })
            .catch(reject);
    });
};
