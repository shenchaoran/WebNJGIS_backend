// 比较的总控制中心，控制模型的开始调用，请求模型的完成进度，请求模型的结果数据，比较这些数据
import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg, ExternalName } from '../models/UDX-schema.class';
import * as PropParser from './UDX.property.controller';
import * as UDXParser from './UDX.parser.controller';
import * as UDXComparators from './UDX.compare.control';
import { cmpSolutionDB } from '../models/cmp-solution.model';

export const insert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.body.solution) {
        cmpSolutionDB.insert(req.body.solution)
            .then(doc => {
                res.locals.resData = {
                    succeed: true
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        return next(new Error('invalid request body!'));
    }
}

export const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.body.id) {
        cmpSolutionDB.remove({_id: req.body.id})
            .then(() => {
                res.locals.resData = {
                    succeed: true
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        return next(new Error('invalid request body!'));
    }
}

export const find = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.query.id) {
        cmpSolutionDB.find({_id: req.body.id})
            .then(doc => {
                res.locals.resData = {
                    doc: doc
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        return next(new Error('invalid request body!'));
    }
}

export const update = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if(req.body.solution) {
        cmpSolutionDB.update({_id: req.body.id}, req.body.solution)
            .then(() => {
                res.locals.resData = {
                    succeed: true
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        return next(new Error('invalid request body!'));
    }
}