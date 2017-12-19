import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import { ObjectID } from 'mongodb';
import * as mongoose from 'mongoose';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import * as PropParser from './UDX.property.controller';
import * as UDXParser from './UDX.parser.controller';
import * as UDXComparators from './UDX.compare.control';
import { cmpTaskDB, cmpSolutionDB, calcuTaskDB, CalcuTask, CalcuTaskState } from '../models';
import { ResourceSrc } from '../models/resource.enum';

export const convert2Tree = (user, docs: Array<any>): Promise<any> => {
    const trees = {
        public: [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'bbbbbbbbb',
            expanded: true,
            items: []
        }],
        personal: undefined
    };
    const publicDocs = _.filter(docs, doc => doc.src === ResourceSrc.PUBLIC);
    let personalDocs = undefined;
    if(user && user.username !== 'Tourist') {
        trees.personal = [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'ccccccccccc',
            expanded: true,
            items: []
        }];
        personalDocs = <Array<any>>_.filter(docs, doc => doc.auth.userId === user._id.toString());
        if(personalDocs) {
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
}

export const start = (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpTaskDB.find({_id: id})
            .then(docs => {
                if(docs.length) {
                    const doc = docs[0];
                    return resolve(doc);
                }
                else {
                    return reject(new Error('Can\'t find this task!'));
                }
            })
            .then(doc => {
                // TODO

                return resolve();
            })
            .catch(reject);
    });
};

export const insert = (doc: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        cmpSolutionDB.find({_id: doc.cmpCfg.solutionId})
            .then(docs => {
                if(docs.length) {
                    const solution = docs[0];
                    return Promise.resolve(solution);
                }
                else {
                    return reject(new Error('can\'t find related comparison solution'));
                }
            })
            .then(sln => {
                const msList = <Array<any>>(sln.cfg.ms);
                const calcuTasks = _.map(msList, ms => {
                    if(doc.calcuCfg.dataSrc === 'std') {
                        return ({
                            _id: new ObjectID(),
                            msId: ms.msId,
                            nodeName: ms.nodeName,
                            calcuCfg: doc.calcuCfg,
                            state: CalcuTaskState.INIT
                        } as CalcuTask);
                    }
                    else if(doc.calcuCfg.dataSrc === 'upload') {
                        const calcuCfg = _.cloneDeep(doc.calcuCfg);
                        calcuCfg.dataRefer = _.filter(calcuCfg.dataRefer, refer => {
                            return (<any>refer).msId === ms.msId;
                        });
                        return ({
                            _id: new ObjectID(),
                            msId: ms.msId,
                            nodeName: ms.nodeName,
                            calcuCfg: calcuCfg,
                            state: CalcuTaskState.INIT
                        } as CalcuTask);
                    }
                });
                return Promise.all(_.map(calcuTasks, task => {
                    return new Promise((resolve, reject) => {
                        calcuTaskDB.insert(task)
                            .then(calTask => {
                                if(sln.calcuTasks === undefined) {
                                    sln.calcuTasks = [];
                                }
                                sln.calcuTasks.push(calTask._id);
                                return resolve(calTask);
                            })
                            .catch(reject);
                    });
                }))
                    .then(rsts => {
                        return Promise.resolve(sln);
                    })
                    .catch(reject);
            })
            .then((sln) => {
                cmpTaskDB.insert(sln)
                    .then(_doc => {
                        return resolve(_doc);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

export const updateCmpObj = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        
    });
}


const parseRegion = (): Promise<any> => {
    return ;
};

const dispatchTask = (): Promise<any> => {
    return ;
}