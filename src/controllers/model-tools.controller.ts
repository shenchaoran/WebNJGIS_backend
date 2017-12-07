import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
import * as DataCtrl from '../controllers/data.controller';
import { modelServiceDB } from '../models/model-service.model';


export const insert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.body.ms != undefined) {
        modelServiceDB.insert(req.body.ms)
            .then(doc => {
                res.locals.resData = doc;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        return next(new Error('add resource into database failed!'));
    }
}

export const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.params.id != undefined) {
        modelServiceDB.remove({_id: req.params.id})
            .then(docs => {
                res.locals.resData = docs;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        return next(new Error('can\'t find related resource in the database!'));
    }
}

export const getModelTools = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    modelServiceDB.find({})
        .then(docs => {
            res.locals.resData = docs;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

export const convert2Tree = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const models = <Array<any>>res.locals.resData;
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
    res.locals.resData = [category];
    res.locals.template = {};
    res.locals.succeed = true;
    return next();
};

export const getModelTool = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.params.id === 'tree-mode') {
        // 这里路由不太合理，所以会跳转到这里
        return next();
    }
    if (req.params.id === 'ping') {
        return next();
    }
    
    modelServiceDB.find({_id: req.params.id})
        .then(docs => {
            if(docs.length) {
                res.locals.resData = docs[0];
                res.locals.template = {};
                res.locals.succeed = true;
            }
            else {
                res.locals.resData = undefined;
                res.locals.template = {};
                res.locals.succeed = true;
            }
        })
        .catch(next);
};

export const invokeModelTool = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const url = APIModel.getAPIUrl('model-invoke', req.params);
    const form: any = req.query;
    const inputs = JSON.parse(form.inputdata);
    const inputsId = _.map(inputs, input => (<any>input).DataId);

    const postDataPromises = _.map(inputsId, DataCtrl.pushData);
    Promise.all(postDataPromises)
        .then(rsts => {
            // console.log(rsts);
            _.map(inputs, (input, i) => {
                (<any>input).DataId = rsts[i];
            });
            form.inputdata = JSON.stringify(inputs);

            return RequestCtrl.getByServer(url, form);
        })
        .then((response: any) => {
            response = JSON.parse(response);
            if (response.res === 'suc') {
                res.locals.resData = {
                    msrid: response.msr_id
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            } else {
                return next(new Error('model service invoke failed!'));
            }
        })
        .catch(next);
};

export const getInvokeRecord = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const url = APIModel.getAPIUrl('invoke-record', req.params);
    RequestCtrl.getByServer(url, {})
        .then(response => {
            response = JSON.parse(response);
            if (response.result === 'suc') {
                const msr = response.data;
                if (msr.msr_time === 0) {
                    res.locals.resData = {
                        finished: false
                    };
                    res.locals.template = {};
                    res.locals.succeed = true;
                    return next();
                } else {
                    const outputs = msr.msr_output;
                    Promise.all(_.map(outputs, DataCtrl.pullData))
                        .then(rsts => {
                            res.locals.resData = {
                                finished: true,
                                outputs: rsts
                            };
                            res.locals.template = {};
                            res.locals.succeed = true;
                            return next();
                        })
                        .catch(next);
                }
            } else {
                const err: any = new Error('get msr failed!');
                err.code = '500';
                return next(err);
            }
        })
        .catch(next);
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
