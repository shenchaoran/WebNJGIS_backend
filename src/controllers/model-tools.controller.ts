import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
import * as DataCtrl from '../controllers/data.controller';

/**
 * 获取模型服务列表
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
export const getModelTools = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const url = APIModel.getAPIUrl('model-tools');
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if (inquireData.result === 'suc') {
                res.locals.resData = inquireData.data;
                res.locals.template = [
                    {
                        _id: 'string',
                        ms_model: {
                            m_name: 'string',
                            m_type: 'string',
                            m_url: 'string',
                            p_id: 'string',
                            m_id: undefined,
                            m_register: 'boolean'
                        },
                        mv_num: 'string',
                        ms_des: 'string',
                        ms_platform: 'number',
                        ms_update: 'string',
                        ms_path: 'string',
                        ms_img: undefined,
                        ms_xml: 'string',
                        ms_status: 'number',
                        ms_user: {
                            u_name: 'string',
                            u_email: 'string'
                        },
                        ms_limited: 'number',
                        ms_permission: 'number',
                        __v: 'number'
                    }
                ];
                res.locals.succeed = true;
            }
            return next();
        })
        .catch(err => {
            next(err);
        });
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
    _.map(models, model => {
        category.items.push({
            type: 'leaf',
            label: model.ms_model.m_name,
            value: model,
            id: model._id
        });
    });
    res.locals.resData = [category];
    res.locals.template = {};
    res.locals.succeed = true;
    return next();
};

/**
 * 从数据库中获取模型服务详情
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns 
 */
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
    const url = APIModel.getAPIUrl('model-tool', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if (inquireData.result === 'suc') {
                res.locals.resData = inquireData.data;
                res.locals.template = {
                    _id: 'string',
                    ms_model: {
                        m_name: 'string',
                        m_type: 'string',
                        m_url: 'string',
                        p_id: 'string',
                        m_id: undefined,
                        m_register: 'boolean'
                    },
                    mv_num: 'string',
                    ms_des: 'string',
                    ms_platform: 'number',
                    ms_update: 'string',
                    ms_path: 'string',
                    ms_img: undefined,
                    ms_xml: 'string',
                    ms_status: 'number',
                    ms_user: {
                        u_name: 'string',
                        u_email: 'string'
                    },
                    ms_limited: 'number',
                    ms_permission: 'number',
                    __v: 'number'
                };
                res.locals.succeed = true;
            }
            return next();
        })
        .catch(next);
};

/**
 * 获取模型服务输入数据
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
export const getModelInput = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const url = APIModel.getAPIUrl('model-input', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if (inquireData.input !== undefined) {
                res.locals.resData = {};
                const myStates: Array<{
                    $: any;
                    inputs: Array<any>;
                    outputs: Array<any>;
                }> = [];
                _.map(<Array<any>>inquireData.input.States, state => {
                    const myState = {
                        $: state.$,
                        inputs: [],
                        outputs: []
                    };
                    _.map(<Array<any>>state.Event, event => {
                        let schemaName;
                        if (
                            event.DispatchParameter !== undefined &&
                            event.DispatchParameter.$ !== undefined &&
                            event.DispatchParameter.$.datasetReference !==
                                undefined
                        ) {
                            schemaName =
                                event.DispatchParameter.$.datasetReference;
                        } else if (
                            event.ResponseParameter !== undefined &&
                            event.ResponseParameter.$ !== undefined &&
                            event.ResponseParameter.$.datasetReference !==
                                undefined
                        ) {
                            schemaName =
                                event.ResponseParameter.$.datasetReference;
                        }
                        if (event.$.type === 'noresponse') {
                            myState.outputs.push({
                                name: event.$.name,
                                type: event.$.type,
                                optional: event.$.optional,
                                description: event.$.description,
                                schema: schemaName
                            });
                        } else if (event.$.type === 'response') {
                            myState.inputs.push({
                                name: event.$.name,
                                type: event.$.type,
                                optional: event.$.optional,
                                description: event.$.description,
                                schema: schemaName
                            });
                        }
                    });
                    myStates.push(myState);
                });
                res.locals.resData.states = myStates;
                res.locals.template = {};
                res.locals.succeed = true;
            }
            return next();
        })
        .catch(next);
};

/**
 * 获取模型中的所有schema
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
export const getModelSchemas = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const url = APIModel.getAPIUrl('model-schemas', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            res.locals.resData.schemas = extractSchema(inquireData);
            return next();
        })
        .catch(next);
};

/**
 * 调用模型
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
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

/**
 * 获取msr
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
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
 * 
 * @param {any} mdlStr 
 * @returns 
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
