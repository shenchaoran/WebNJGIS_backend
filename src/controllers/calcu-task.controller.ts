import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import * as CmpTaskCtrl from './cmp-task.controller';
import { calcuTaskDB, CalcuTaskState, cmpTaskDB } from '../models';
import { ObjectID } from 'mongodb';

export const getCalcuTaskDetail = (id): Promise<any> => {
    return calcuTaskDB.findOne({_id: id})
        .then(Promise.resolve)
        .catch(Promise.reject);
}

export const insertBatch = (docs): Promise<any> => {
    // TODO 结果处理
    _.map(docs as any[], doc => {
        // 删除无关字段
        doc._id = new ObjectID(doc._id);
    });
    return calcuTaskDB.insertBatch(docs);
}

export const getReadyTask = (nodeName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        calcuTaskDB
            .find({
                nodeName: nodeName,
                state: CalcuTaskState.COULD_START
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * 更新calcu-task记录的状态
 */
export const updateState = (
    taskId: string,
    oldState: number,
    newState: number,
    nodeName?: string
): Promise<any> => {
    return new Promise((resolve, reject) => {
        let valid = true;
        if (oldState === CalcuTaskState.INIT) {
            if (newState !== CalcuTaskState.COULD_START) {
                valid = false;
            }
        }
        else if (oldState === CalcuTaskState.COULD_START) {
            if (newState !== CalcuTaskState.START_PENDING) {
                valid = false;
            }
        }
        else if (oldState === CalcuTaskState.START_PENDING) {
            if (
                newState !== CalcuTaskState.START_FAILED &&
                newState !== CalcuTaskState.RUNNING
            ) {
                valid = false;
            }
        } else if (oldState === CalcuTaskState.RUNNING) {
            // 此处全部交给 onFinished 处理
            valid = false;
        }

        if (!valid) {
            return reject(new Error('invalidate state change!'));
        }
        else {
            const where = nodeName ?
                {
                    _id: taskId,
                    state: oldState
                } :
                {
                    _id: taskId,
                    nodeName: nodeName,
                    state: oldState
                };
            calcuTaskDB
                .update(
                    where,
                    {
                        $set: {
                            state: newState
                        }
                    }
                )
                .then(rst => {
                    return resolve();
                })
                .catch(reject);
        }
    });
};

/**
 * 更新calcu-task 的 progress 和 data | output
 */
export const updateOnFinished = (
    nodeName: string,
    taskId: string,
    outputs: any[],
    progress: number,
    state: number
): Promise<any> => {
    return new Promise((resolve, reject) => {
        calcuTaskDB.findOne({
            _id: taskId,
            nodeName: nodeName
        })
            .then(doc => {
                doc.state = state;
                doc.progress = progress;
                if (state === CalcuTaskState.FINISHED_SUCCEED) {
                    _
                        .chain(doc.IO.data)
                        .filter(event => event.type === 'output')
                        .map(event => {
                            _.map(outputs, output => {
                                if (event.id === output.id) {
                                    event.value = output.value;
                                }
                            });
                        })
                        .value();
                }

                calcuTaskDB.update({
                    _id: taskId
                }, doc)
                    .then(rst => {

                        if (progress === 100) {
                            CmpTaskCtrl.onCalcuTaskSucceed(doc);
                        }
                        return resolve(rst);
                    })
            })
            .catch(reject);
    });
};

/**
 * deprecated
 * 把calcu-task的output的dataId插入到cmpObj对应的dataRefer中
 * 开始进行output数据的比较
 */
export const updateCmpTask = (calcuTaskId: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        let cmpTaskId;
        calcuTaskDB.findOne({ _id: calcuTaskId })
            .then(calcuTask => {
                cmpTaskId = calcuTask.cmpTaskId;
                return CmpTaskCtrl.updateDataRefer(calcuTask);
            })
            .then(() => {
                return CmpTaskCtrl.updateTaskState(cmpTaskId);
            })
            .then(() => {
                return CmpTaskCtrl.updateCmpResult(cmpTaskId);
                // TODO 这里没有管回调
            })
            .catch(reject);
    });
};
