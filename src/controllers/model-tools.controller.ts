import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
import DataCtrl from '../controllers/data.controller';
import { modelServiceDB } from '../models/model-service.model';

const db = modelServiceDB;

export default class ModelService {
    constructor() {}

    static findAll(): Promise<any> {
        return db.find({})
            .then(docs =>{
                return Promise.resolve(docs);
            })
            .catch(Promise.reject)
    }

    static findByPage(pageOpt: {
        pageSize: number,
        pageNum: number
    }): Promise<any> {
        return db.findByPage({}, {
            pageSize: pageOpt.pageSize,
            pageNum: pageOpt.pageNum
        })
            .then(rst => {
                return Promise.resolve(rst);
            })
            .catch(Promise.reject);
    }

    static getModelDetail(id): Promise<any> {
        return db.findOne({_id: id})
            .then(Promise.resolve)
            .catch(Promise.reject)
    }

}

export const convert2Tree = (user, docs): Promise<any> => {
    const models = <Array<any>>docs;
    // TODO 这里先统一到一个分类下，等有真正的分类方法后在实现
    const category = {
        type: 'root',
        label: 'Earth\'s carbon cycle model',
        value: undefined,
        id: 'asldfjlas',
        expanded: true,
        items: []
    };
    _.map(models, ms => {
        category.items.push({
            type: 'leaf',
            label: ms.MDL.meta.name,
            value: ms,
            id: ms._id
        });
    });
    return Promise.resolve([category]);
};

export const invokeModelTool = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // const url = APIModel.getAPIUrl('model-invoke', req.params);
    // const form: any = req.query;
    // const inputs = JSON.parse(form.inputdata);
    // const inputsId = _.map(inputs, input => (<any>input).DataId);

    // const postDataPromises = _.map(inputsId, DataCtrl.pushData);
    // Promise.all(postDataPromises)
    //     .then(rsts => {
    //         // console.log(rsts);
    //         _.map(inputs, (input, i) => {
    //             (<any>input).DataId = rsts[i];
    //         });
    //         form.inputdata = JSON.stringify(inputs);

    //         return RequestCtrl.getByServer(url, form);
    //     })
    //     .then((response: any) => {
    //         response = JSON.parse(response);
    //         if (response.res === 'suc') {
    //             res.locals.resData = {
    //                 msrid: response.msr_id
    //             };
    //             res.locals.template = {};
    //             res.locals.succeed = true;
    //             return next();
    //         } else {
    //             return next(new Error('model service invoke failed!'));
    //         }
    //     })
    //     .catch(next);
};

export const getInvokeRecord = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // const url = APIModel.getAPIUrl('invoke-record', req.params);
    // RequestCtrl.getByServer(url, {})
    //     .then(response => {
    //         response = JSON.parse(response);
    //         if (response.result === 'suc') {
    //             const msr = response.data;
    //             if (msr.msr_time === 0) {
    //                 res.locals.resData = {
    //                     finished: false
    //                 };
    //                 res.locals.template = {};
    //                 res.locals.succeed = true;
    //                 return next();
    //             } else {
    //                 const outputs = msr.msr_output;
    //                 Promise.all(_.map(outputs, DataCtrl.pullData))
    //                     .then(rsts => {
    //                         res.locals.resData = {
    //                             finished: true,
    //                             outputs: rsts
    //                         };
    //                         res.locals.template = {};
    //                         res.locals.succeed = true;
    //                         return next();
    //                     })
    //                     .catch(next);
    //             }
    //         } else {
    //             const err: any = new Error('get msr failed!');
    //             err.code = '500';
    //             return next(err);
    //         }
    //     })
    //     .catch(next);
};

///////////////////////// processer

/**
 * 获取模型中所有的schema
 */
const extractSchema = mdlStr => {
    const doc = new dom().parseFromString(mdlStr);
    let schemasDom: Array<any> = xpath.select(
        '/ModelClass/Behavior/DatasetDeclarations/DatasetDeclaration',
        doc
    );
    if (schemasDom.length == 0) {
        schemasDom = xpath.select(
            '/ModelClass/Behavior/RelatedDatasets/DatasetItem',
            doc
        );
    }
    const schemas = {};
    _.map(schemasDom, schemaDom => {
        const key = schemaDom.attributes.getNamedItem('name').nodeValue;
        let schemaDomStr = schemaDom.toString();
        schemaDomStr = schemaDomStr.replace(/\"/g, '&quot');
        schemaDomStr = schemaDomStr.replace(/\</g, '&lt');
        schemaDomStr = schemaDomStr.replace(/\>/g, '&gt');
        schemas[key] = schemaDomStr;
    });
    return schemas;
};
