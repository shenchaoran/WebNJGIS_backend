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
