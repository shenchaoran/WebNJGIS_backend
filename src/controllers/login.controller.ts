import { Response, Request, NextFunction } from "express";
import * as Promise from 'bluebird';

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';

export const getModelTools = (req: Request, res: Response, next: NextFunction) => {
    res.locals.resData = '';
    res.locals.template = {};
    res.locals.successed = true;
    return next();
};