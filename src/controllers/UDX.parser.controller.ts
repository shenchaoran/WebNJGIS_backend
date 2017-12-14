import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
const debug = require('debug');
const dataDebug = debug('WebNJGIS: Data');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import { setting } from '../config/setting';
import {
    geoDataDB,
    GeoDataClass
} from '../models/UDX-data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
import { UDXTableXML } from '../models/UDX-type.class';
import * as StringUtils from '../utils/string.utils';
import * as PropParser from './UDX.property.controller';
import * as VisualParser from './UDX.visualization.controller';
import { UDXCfg } from '../models/UDX-cfg.class';
import { UDXSchema } from '../models/UDX-schema.class';
import { ResourceSrc } from '../models/resource.enum';

export const parseUDXProp = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    dataDebug(req.params);

    geoDataDB.find({ _id: req.params.id })
        .then(rsts => {
            if (rsts.length) {
                const doc = rsts[0];
                return Promise.resolve(doc);
            } else {
                return next(new Error("can't find data!"));
            }
        })
        .then(parseUDXCfg)
        .then(PropParser.parse)
        .then(parsed => {
            res.locals.resData = parsed;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

export const parseUDXVisual = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    dataDebug(req.params);
    geoDataDB.find({ _id: req.params.id })
        .then(rsts => {
            if (rsts.length) {
                const doc = rsts[0];
                return Promise.resolve(doc);
            } else {
                return next(new Error("can't find data!"));
            }
        })
        .then(parseUDXCfg)
        .then(VisualParser.parse)
        .then(parsed => {
            res.locals.resData = parsed;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

export const parseUDXCfg = (cfgPath: string): Promise<UDXCfg> => {
    const folderPath = cfgPath.substring(0, cfgPath.lastIndexOf('index.json'));
    return new Promise((resolve, reject) => {
        fs.readFile(cfgPath, (err, dataBuf) => {
            if (err) {
                return reject(err);
            }
            try {
                // const udxcfg = new UDXCfg();
                const cfgStr = dataBuf.toString();
                const udxcfg = JSON.parse(cfgStr);
                return resolve(udxcfg);
            } catch (e) {
                return reject(e);
            }
        });
    });
};
