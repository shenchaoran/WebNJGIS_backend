import { Response, Request, NextFunction } from "express";
import * as Promise from 'bluebird';
import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';

export const getModelTools = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('model-tools');
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.result === 'suc') {
                res.locals.resData = inquireData.data;
                res.locals.template = [{
                    "_id": "string",
                    "ms_model": {
                        "m_name": "string",
                        "m_type": "string",
                        "m_url": "string",
                        "p_id": "string",
                        "m_id": undefined,
                        "m_register": 'boolean'
                    },
                    "mv_num": "string",
                    "ms_des": "string",
                    "ms_platform": 'number',
                    "ms_update": "string",
                    "ms_path": "string",
                    "ms_img": undefined,
                    "ms_xml": "string",
                    "ms_status": 'number',
                    "ms_user": {
                        "u_name": "string",
                        "u_email": "string"
                    },
                    "ms_limited": 'number',
                    "ms_permission": 'number',
                    "__v": 'number'
                }];
                res.locals.succeed = true;
            }
            return next();
        })
        .catch(err => {
            next(err);
        });
};

export const getModelTool = (req: Request, res: Response, next: NextFunction) => {
    if(req.params.id === 'ping') {
        return next();
    }
    const url = APIModel.getAPIUrl('model-tool', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.result === 'suc') {
                res.locals.resData = inquireData.data;
                res.locals.template = {
                    "_id": "string",
                    "ms_model": {
                        "m_name": "string",
                        "m_type": "string",
                        "m_url": "string",
                        "p_id": "string",
                        "m_id": undefined,
                        "m_register": 'boolean'
                    },
                    "mv_num": "string",
                    "ms_des": "string",
                    "ms_platform": 'number',
                    "ms_update": "string",
                    "ms_path": "string",
                    "ms_img": undefined,
                    "ms_xml": "string",
                    "ms_status": 'number',
                    "ms_user": {
                        "u_name": "string",
                        "u_email": "string"
                    },
                    "ms_limited": 'number',
                    "ms_permission": 'number',
                    "__v": 'number'
                };
                res.locals.succeed = true;
            }
            return next();
        })
        .catch(next);
};

// TODO promise ...
export const getModelInput = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('model-input', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.input !== undefined) {
                res.locals.resData = {};
                const myStates: Array<{
                    $: any;
                    inputs: Array<any>;
                    outputs: Array<any>;
                }> = [];
                _.map(<Array<any>>inquireData.input.States, (state) => {
                    const myState = {
                        $: state.$,
                        inputs: [],
                        outputs: []
                    };
                    _.map(<Array<any>>state.Event, event => {
                        if(event.$.type === 'noresponse') {
                            myState.outputs.push({
                                name: event.$.name,
                                type: event.$.type,
                                optional: event.$.optional,
                                description: event.$.description,
                                schema: event.DispatchParameter.$.datasetReference
                            });
                        }
                        else if(event.$.type === 'response') {
                            myState.inputs.push({
                                name: event.$.name,
                                type: event.$.type,
                                optional: event.$.optional,
                                description: event.$.description,
                                schema: event.ResponseParameter.$.datasetReference
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

export const getModelSchemas = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('model-schemas', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            res.locals.resData.schemas = extractSchema(inquireData);
            return next();
        })
        .catch(next);
};

export const invokeModelTool = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('model-invoke', req.params);
    const form: any = req.query;
    RequestCtrl.getByServer(url, form)
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.res === 'suc') {
                res.locals.resData = {
                    msrid: inquireData.msr_id
                };
                res.locals.template = {};
                res.locals.succeed = true;
            }
            return next();
        })
        .catch(next);
};

export const getInvokeRecord = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('invoke-record', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.result === 'suc') {
                res.locals.resData = inquireData.data;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            }
            else {
                const err: any = new Error('get msr failed!');
                err.code = '500';
                return next(err);
            }
        })
        .catch(next);
};


///////////////////////// processer
const extractSchema = (mdlStr) => {
    const doc = new dom().parseFromString(mdlStr);
    let schemasDom: Array<any> = xpath.select('/ModelClass/Behavior/DatasetDeclarations/DatasetDeclaration', doc);
    if(schemasDom.length == 0) {
        schemasDom = xpath.select('/ModelClass/Behavior/RelatedDatasets/DatasetItem',doc);
    }
    const schemas = {};
    _.map(schemasDom, (schemaDom) => {
        const key = schemaDom.attributes.getNamedItem('name').nodeValue;
        let schemaDomStr = schemaDom.toString();
        schemaDomStr = schemaDomStr.replace(/\"/g,'&quot');
        schemaDomStr = schemaDomStr.replace(/\</g,'&lt');
        schemaDomStr = schemaDomStr.replace(/\>/g,'&gt');
        schemas[key] = schemaDomStr;
    });
    return schemas;
};