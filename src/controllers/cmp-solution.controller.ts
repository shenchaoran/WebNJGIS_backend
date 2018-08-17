// 比较的总控制中心，控制模型的开始调用，请求模型的完成进度，请求模型的结果数据，比较这些数据
import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import * as PropParser from './UDX.property.controller';
import * as UDXComparators from './UDX.compare.controller';
import { cmpSolutionDB, cmpTaskDB, modelServiceDB, ResourceSrc, cmpMethodDB } from '../models';
const db = cmpSolutionDB;


export const findByPage = (pageOpt): Promise<any> => {
    return db.findByPage({}, pageOpt)
        .then(rst => {
            return Promise.resolve(rst);
        })
        .catch(Promise.reject);
}

export const getSlnDetail = (id): Promise<any> => {
    return db.findOne({ _id: id })
        .then(expandDoc)
        .then(Promise.resolve)
        .catch(Promise.reject);
}

const expandDoc = (doc): Promise<any> => {
    let methods = new Set();
    _.map(doc.cmpObjs, cmpObj => {
        _.map((cmpObj as any).methods, method => {
            methods.add(method)
        });
    });
    return Promise.map(Array.from(methods), methodId => {
        return cmpMethodDB.findOne({_id: methodId})
    })
        .then(rsts => {
            doc.methods = rsts;
            return Promise.resolve(doc);
        })
        .catch(Promise.reject);
}

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
    const publicDocs = _.filter(docs, doc => doc.auth.src === ResourceSrc.PUBLIC);
    let personalDocs = undefined;
    if (user && user.username !== 'Tourist') {
        trees.personal = [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'ccccccccccc',
            expanded: true,
            items: []
        }];
        personalDocs = <Array<any>>_.filter(docs, doc => doc.auth.userId === user._id.toString());
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
}