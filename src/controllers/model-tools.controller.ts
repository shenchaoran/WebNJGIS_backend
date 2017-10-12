import { Response, Request, NextFunction } from "express";
import * as Promise from 'bluebird';

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
                res.locals.successed = true;
            }
            return next();
        })
        .catch(next);
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
                res.locals.successed = true;
            }
            return next();
        })
        .catch(next);
};

export const getModelInput = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('model-input', req.params);
    RequestCtrl.getByServer(url, {})
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.input !== undefined) {
                res.locals.resData = inquireData.input;
                res.locals.template = {};
                res.locals.successed = true;
            }
            return next();
        })
        .catch(next);
};

export const invoke = (req: Request, res: Response, next: NextFunction) => {
    const url = APIModel.getAPIUrl('model-invoke');
    const params: any = {
        ac: 'run',
        inputData: [],
        outputData: []
    };
    RequestCtrl.getByServer(url, params)
        .then((inquireData: any) => {
            inquireData = JSON.parse(inquireData);
            if(inquireData.result === 'suc') {
                res.locals.resData = inquireData.data;
                res.locals.template = {};
                res.locals.successed = true;
            }
            return next();
        })
        .catch(next);
};