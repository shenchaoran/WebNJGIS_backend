import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import * as CmpTaskCtrl from './cmp-task.controller';
import { calcuTaskDB, CalcuTaskState, cmpTaskDB } from '../models';

export const getInitTask = (nodeName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        calcuTaskDB
            .find({
                nodeName: nodeName,
                state: CalcuTaskState.INIT
            })
            .then(resolve)
            .catch(reject);
    });
};

/**
 * deprecated
 */
export const startMS = (nodeName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        let tasks;
        calcuTaskDB
            .find({
                nodeName: nodeName,
                state: CalcuTaskState.INIT
            })
            .then(docs => {
                tasks = docs;
                return Promise.resolve();
            })
            .then(() => {
                return calcuTaskDB.update(
                    {
                        nodeName: nodeName,
                        state: CalcuTaskState.INIT
                    },
                    {
                        $set: {
                            state: CalcuTaskState.START_PENDING
                        }
                    },
                    {
                        multi: true
                    }
                );
            })
            .then(updateRst => {
                // if (updateRst.ok && updateRst.writeErrors.length === 0) {
                    return resolve(tasks);
                // } else {
                //     return reject(
                //         new Error('error in update calculate tasks!')
                //     );
                // }
            })
            .catch(reject);
    });
};

/**
 * 更新calcu-task记录的状态
 * 如果计算成功，更新cmp-task，包括两部分：
 *     把calcu-task的output的dataId插入到cmpObj对应的dataRefer中
 *     开始进行output数据的比较
 */
export const updateState = (
    nodeName: string,
    taskId: string,
    oldState: number,
    newState: number
): Promise<any> => {
    return new Promise((resolve, reject) => {
        if (oldState === CalcuTaskState.INIT) {
            if (newState !== CalcuTaskState.START_PENDING) {
                return reject(new Error('invalidate state change!'));
            }
        } else if (oldState === CalcuTaskState.START_PENDING) {
            if (
                newState !== CalcuTaskState.START_FAILED &&
                newState !== CalcuTaskState.RUNNING
            ) {
                return reject(new Error('invalidate state change!'));
            }
        } else if (oldState === CalcuTaskState.RUNNING) {
            if (
                newState !== CalcuTaskState.FINISHED_FAILED &&
                newState !== CalcuTaskState.FINISHED_SUCCEED
            ) {
                return reject(new Error('invalidate state change!'));
            }
            if (newState === CalcuTaskState.FINISHED_SUCCEED) {
                // TODO 更新cmp-task
            }
        } else if (oldState === CalcuTaskState.PAUSE) {
            // TODO
        }

        calcuTaskDB
            .update(
                {
                    _id: taskId,
                    nodeName: nodeName,
                    state: oldState
                },
                {
                    $set: {
                        state: newState
                    }
                }
            )
            .then(rst => {
                // if (rst.ok && rst.writeErrors.length === 0) {
                    if (newState === CalcuTaskState.FINISHED_SUCCEED) {
                        // TODO 更新cmp-task
                        updateCmpTask(taskId);
                    }
                    return resolve();
                // } else {
                //     return reject(
                //         new Error('update calculate task state failed!')
                //     );
                // }
            })
            .catch(reject);
    });
};

/**
 * 更新calcu-task 数据库中存的output字段
 */
export const updateData = (
    nodeName: string,
    taskId: string,
    outputs: any[]
): Promise<any> => {
    return new Promise((resolve, reject) => {
        calcuTaskDB
            .update(
                {
                    _id: taskId,
                    nodeName: nodeName
                },
                {
                    $set: {
                        outputs: outputs
                    }
                }
            )
            .then(resolve)
            .catch(reject);
    });
};

/**
 *     把calcu-task的output的dataId插入到cmpObj对应的dataRefer中
 *     开始进行output数据的比较
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
