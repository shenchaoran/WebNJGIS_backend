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
    CmpReaultState,
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
                dispatchCalcuTask(doc)
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

export const updateCmpResult = (cmpTask: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        _.map(Array<any>(cmpTask.cmpCfg.cmpObjs), (cmpObj, i) => {
            cmpObj.methods = _.filter(Array<any>(cmpObj.methods), method => {
                return method.checked === true;
            });
            if (cmpObj.methods.length !== 1) {
                return reject(new Error('invalidate comparison solution!'));
            }
            const method = cmpObj.methods[0].value;
            const schemaType = cmpObj.schemaTypes[0];
            if (schemaType === SchemaName[SchemaName.ASCII_GRID_RAW]) {
                if (
                    method === CmpMethodEnum[CmpMethodEnum.ASCII_GRID_STATISTIC]
                ) {
                } else if (
                    method === CmpMethodEnum[CmpMethodEnum.ASCII_GRID_STATISTIC]
                ) {
                    _.map(Array<any>(cmpObj.dataRefers), (dataRefer, j) => {
                        if(dataRefer.dataId) {
                            let hasCreated = false;
                            _.find(Array<any>(cmpObj.cmpResults), cmpResult => {
                                if(cmpResult.dataId === dataRefer.dataId) {
                                    hasCreated = true;
                                }
                            });
                            if(!hasCreated) {
                                // TODO 可能存在并发问题
                                // 可以通过 $each 解决，一次向数组中插入多个元素
                                const key = `cmpCfg.cmpObjs.${i}.cmpResults`;
                                const tempPush = {};
                                _.set(tempPush, key, {
                                    dataId: dataRefer.dataId,
                                    state: CmpReaultState.PENDING
                                });
                                cmpTaskDB.update({
                                    _id: cmpTask._id
                                }, {
                                    "$push": tempPush
                                })
                                    .then(updateRst => {
                                        if(updateRst.ok && updateRst.writeErrors.length === 0) {
                                            ChildProcessCtrl.newVisualProcess(dataRefer.dataId)
                                                .then(() => {
                                                    const findObj = {
                                                        _id: cmpTask._id
                                                    };
                                                    _.set(findObj, `cmpCfg.cmpObjs.${i}.cmpResults.dataId`, dataRefer.dataId)
                                                    const setObj = {};
                                                    _.set(setObj, `cmpCfg.cmpObjs.${i}.cmpResults.$.state`, CmpReaultState.SUCCEED);
                                                    cmpTaskDB.update(findObj, {
                                                        '$set': setObj
                                                    })
                                                        .then(updateRst => {
                                                            if(updateRst.ok && updateRst.writeErrors.length === 0) {
                            
                                                            }
                                                            else {
                                                                const setObj = {};
                                                                _.set(setObj, `cmpCfg.cmpObjs.${i}.cmpResults.$.state`, CmpReaultState.FAILED);
                                                                cmpTaskDB.update(findObj, {
                                                                    '$set': setObj
                                                                });
                                                                console.log(new Error('update comparison task failed'));
                                                            }
                                                        })
                                                })
                                                .catch(err => {
                                                    console.log(err);
            
                                                })
                                        }
                                        else {
                                            console.log(new Error('update comparison task failed'));
                                        }
                                    })
                                    .catch(console.log);
                            }
                        }
                    });
                }
            } else if (schemaType === SchemaName[SchemaName.SHAPEFILE_RAW]) {
                if (
                    method ===
                    CmpMethodEnum[CmpMethodEnum.SHAPEFILE_INTERPOLATION]
                ) {
                } else if (
                    method === CmpMethodEnum[CmpMethodEnum.SHAPEFILE_STATISTIC]
                ) {
                } else if (
                    method ===
                    CmpMethodEnum[CmpMethodEnum.SHAPEFILE_VISUALIZATION]
                ) {
                }
            } else if (schemaType === SchemaName[SchemaName.TABLE_RAW]) {
                if (method === CmpMethodEnum[CmpMethodEnum.TABLE_CHART]) {
                } else if (
                    method === CmpMethodEnum[CmpMethodEnum.TABLE_STATISTIC]
                ) {
                }
            }
        });
    });
};

const parseRegion = (): Promise<any> => {
    return;
};

const dispatchCalcuTask = (taskDoc: any): Promise<any> => {
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
