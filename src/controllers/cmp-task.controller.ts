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
import * as CalcuTaskCtrl from './calcu-task.controller';
import {
    cmpTaskDB,
    cmpSolutionDB,
    cmpIssueDB,
    calcuTaskDB,
    CalcuTask,
    CalcuTaskState,
    SchemaName,
    CmpMethodEnum,
    CmpState,
} from '../models';
import { ResourceSrc } from '../models/resource.enum';
import * as ChildProcessCtrl from './child-process.controller';

const db = cmpTaskDB;



export const insert = (doc: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        // doc = changeParticipate(doc);
        cmpTaskDB
            .insert(doc)
            .then(_doc => {
                return resolve(_doc);
            })
            .catch(reject);
    });
};

export const findByPage = (pageOpt): Promise<any> => {
    return db.findByPage({}, pageOpt)
        .then(rst => {
            _.map(rst.docs, doc => {
                reduceDoc(doc, '2');
                // expandDoc(doc);
            });
            return Promise.resolve(rst);
        })
        .catch(Promise.reject);
}

export const getTaskDetail = (id: string): Promise<any> => {
    return db.findOne({ _id: id })
        .then(expandDoc)
        .then(Promise.resolve)
        .catch(Promise.reject);
};

/**
 * 以不同力度缩减文档
 * 查询list时，level = 2，查询item 时，level = 1
 */
const reduceDoc = (doc, level?: '1' | '2') => {
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

const expandDoc = (doc): Promise<any> => {
    let calcuTaskPromise = undefined;
    if (doc.calcuTaskIds && doc.calcuTaskIds.length) {
        calcuTaskPromise = Promise.all(_.map(doc.calcuTaskIds, id => {
            return calcuTaskDB.findOne({ _id: id });
        }));
    }
    return Promise.all([
        doc.issueId ?
            cmpIssueDB.findOne({ _id: doc.issueId }) : undefined,
        doc.solutionId ?
            cmpSolutionDB.findOne({ _id: doc.solutionId }) : undefined,
        calcuTaskPromise ?
            calcuTaskPromise : undefined
    ])
        .then(rsts => {
            doc.issue = rsts[0];
            doc.solution = rsts[1];
            doc.calcuTasks = rsts[2];
            return Promise.resolve(doc);
        })
        .catch(Promise.reject);
}

/**
 * 根据taskId和请求的数据类型返回cmp-data的详情
 * 没有直接放在task中是因为太大了
 */
export const getCmpResult = (taskId, cmpObjId, msId): Promise<any> => {
    let cmpRst;
    return cmpTaskDB.findOne({ _id: taskId })
        .then(cmpTask => {
            _.map(cmpTask.cmpCfg.cmpObjs as any[], cmpObj => {
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
            return Promise.resolve(cmpRst);
        })
        .catch(Promise.reject);
};


/**
 * 返回标准结果，目前没有标准结果集，只能返回和计算结果相同的数据
 *      table数据返回table
 *      ascii grid 数据返回 cmpResult-> image里的结构
 *      statistic 返回 hot table 的数据源
 */
export const getStdResult = (cmpTaskId): Promise<any> => {
    const stdResult = [];
    return cmpTaskDB.findOne({ _id: cmpTaskId })
        .then(cmpTask => {
            // TODO
            _.map(cmpTask.cmpCfg.cmpObjs as any[], cmpObj => {
                _.map(cmpObj.methods as any[], method => {

                });
            });

        })
        .catch(Promise.reject);
}

const startCmpDataItem = (
    cmpTaskId: string, 
    updatePath: string, 
    schemaId: string, 
    methods: string[], 
    dataId: string,
    field?: string
): Promise<any> => {
    return ChildProcessCtrl.newCmpProcess(
        dataId,
        methods,
        field
    )
        .then(cmpRst => {
            // TODO 并发可能导致 updatePath 的变化
            const setObj = {};
            setObj[updatePath] = {
                image: cmpRst.image,
                chart: cmpRst.chart,
                GIF: cmpRst.GIF,
                statistic: cmpRst.statistic
            };
            cmpTaskDB.update(
                {
                    _id: cmpTaskId
                },
                {
                    $set: setObj
                }
            )
        });
}

/**
 * 启动 dataItem 的比较，更新
 *      dataRefers 的 dataId
 *      calcuTasks 的 progress
 */
export const onCalcuTaskSucceed = (calcuTask): Promise<any> => {
    return cmpTaskDB.findOne({
        _id: calcuTask.cmpTaskId
    })
        .then(cmpTask => {
            // 更新progress
            _
                .chain(cmpTask.calcuTasks)
                .find(item => item._id === calcuTask._id)
                .map(item => {
                    item.progress = 100;
                })
                .value();

            // 更新dataRefer
            _
                .chain(cmpTask.cmpObjs)
                .map((cmpObj, i) => {
                    _
                        .chain(cmpObj.dataRefers)
                        // .filter(dataRefer => dataRefer.msId === calcuTask.msId)
                        .map((dataRefer, j) => {
                            if (dataRefer.msId === calcuTask.msId) {
                                _
                                    .chain(calcuTask.IO.data)
                                    .filter(event => event.type === 'output')
                                    .map(event => {
                                        if (event.id === dataRefer.eventName) {
                                            dataRefer.dataId = event.value;
                                            // 比较的入口 放在这里
                                            dataRefer.cmpResult = {};
                                            const updatePath = `cmpObjs.${i}.dataRefers.${j}.cmpResult`
                                            startCmpDataItem(cmpTask._id, updatePath, cmpObj.schemaId, cmpObj.methods, dataRefer.dataId, dataRefer.field);
                                        }
                                    })
                                    .value();
                            }

                        })
                        .value();
                })
                .value();

            cmpTaskDB.update({
                _id: cmpTask._id
            }, cmpTask)
                .then(rst => {
                    return Promise.resolve();
                })
        })
        .catch(Promise.reject);
};

// region deprecated

/**
 * deprecated
 */
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

/**
 * deprecated
 * cmp-task.cmpCfg.ms.participate属性不准，这里根据比较对象是否需要计算得到，来更新该字段
 */
const changeParticipate = (cmpTask: any) => {
    _.map(cmpTask.cmpCfg.ms as Array<any>, ms => {
        ms.participate = false;
        _.map(cmpTask.cmpCfg.cmpObjs as Array<any>, cmpObj => {
            _.map(cmpObj.dataRefers as Array<any>, dataRefer => {
                if (ms.participate === false) {
                    if (dataRefer.msId === ms.msId) {
                        if (
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
 * deprecated 根据cmp-sln中涉及到的ms，插入calcu-task条目
 */
const insertCalcuTask = (cmpTask: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        const calcuTasks = [];
        _.map((cmpTask.cmpCfg.ms) as Array<any>, ms => {
            if (ms.participate) {
                if (cmpTask.calcuCfg.dataSrc === 'std') {
                    calcuTasks.push(new CalcuTask({
                        _id: new ObjectID(),
                        msId: ms.msId,
                        cmpTaskId: cmpTask._id,
                        nodeName: ms.nodeName,
                        calcuCfg: cmpTask.calcuCfg,
                        state: CalcuTaskState.INIT
                    }));
                } else if (cmpTask.calcuCfg.dataSrc === 'upload') {
                    const calcuCfg = _.cloneDeep(cmpTask.calcuCfg);
                    calcuCfg.dataRefers = _.filter(
                        calcuCfg.dataRefers,
                        refer => {
                            return (<any>refer).msId === ms.msId;
                        }
                    );
                    calcuTasks.push(new CalcuTask({
                        _id: new ObjectID(),
                        msId: ms.msId,
                        cmpTaskId: cmpTask._id,
                        nodeName: ms.nodeName,
                        calcuCfg: calcuCfg,
                        state: CalcuTaskState.INIT
                    }));
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
 * deprecated
 * 更新cmpState 字段
 */
export const updateTaskState = (cmpTaskId: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        return cmpTaskDB.findOne({ _id: cmpTaskId })
            .then(cmpTask => {
                let state = CmpState.RUNNING;
                // 有没有完成分为两部分：calcuTask-state, cmpResult-state
                let allFinished = true;
                _.map(cmpTask.calcuTasks as Array<any>, calcuTask => {
                    if (allFinished) {
                        if (
                            calcuTask.state !== CalcuTaskState.FINISHED_FAILED &&
                            calcuTask.state !== CalcuTaskState.FINISHED_SUCCEED
                        ) {
                            allFinished = false;
                        }
                    }
                });
                if (allFinished) {
                    _.map(cmpTask.cmpCfg.cmpObjs as Array<any>, cmpObj => {
                        _.map(cmpObj.dataRefers as Array<any>, dataRefer => {
                            if (allFinished) {
                                if (
                                    dataRefer.cmpResult === undefined ||
                                    dataRefer.cmpResult.state !== CmpState.FINISHED
                                ) {
                                    allFinished = false;
                                }
                            }
                        });
                    });
                }

                if (allFinished) {
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
 * deprecated
 * 更新cmpObj的dataRefer的dataId 字段
 * 当calcu-task计算完成时调用
 */
export const updateDataRefer = (calcuTask): Promise<any> => {
    const cmpTaskId = calcuTask.cmpTaskId;
    return new Promise((resolve, reject) => {
        return cmpTaskDB.findOne({ _id: cmpTaskId })
            .then(cmpTask => {
                const setObj = {};
                _.map((calcuTask.outputs) as Array<any>, output => {
                    _.map((cmpTask.cmpCfg.cmpObjs) as Array<any>, (cmpObj, i) => {
                        _.map((cmpObj.dataRefers) as Array<any>, (dataRefer, j) => {
                            if (
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

/**
 * deprecated
 * 开始比较的入口
 * 更新cmpTask的比较结果
 * 从dataRefer中取数据，如果该data没有做过cmp，就让他去参与比较，并将比较结果更新到数据库中
 * 在两处调用：
 *      calculate-task计算完成后，开始计算结果的比较；
 *      start cmp-task时，开始上传数据的比较
 */
export const updateCmpResult = (cmpTaskId: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB.findOne({ _id: cmpTaskId })
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

// endregion