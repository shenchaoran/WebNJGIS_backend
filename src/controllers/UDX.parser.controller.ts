import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
const dataDebug = debug('WebNJGIS: Data');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import { setting } from '../config/setting';
import { DataModelInstance, GeoDataType, GeoDataClass } from '../models/data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
import { UDXType, UDXTable } from '../models/UDX.type.model';
import * as StringUtils from '../utils/string.utils';
import * as PropParser from './UDX.property.controller';
import * as VisualParser from './UDX.visualization.controller';

export const parseUDXProp = (req: Request, res: Response, next: NextFunction) => {
    dataDebug(req.params);
    const url = APIModel.getAPIUrl('download-geo-data', req.params);
    RequestCtrl.getByServer(url, undefined)
        .then(parseUDXType)
        .then(PropParser.parse)
        .then(parsed => {
            res.locals.resData = parsed;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

export const parseUDXVisual = (req: Request, res: Response, next: NextFunction) => {
    dataDebug(req.params);
    const url = APIModel.getAPIUrl('download-geo-data', req.params);
    RequestCtrl.getByServer(url, undefined)
        .then(parseUDXType)
        .then(VisualParser.parse)
        .then(parsed => {
            res.locals.resData = parsed;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
}

// 对内部使用的常用UDX进行解析，其他格式暂不支持。
const parseUDXType = (udxStr): Promise<{type: any; UDX: any}> => {
    return new Promise((resolve, reject) => {
        let udxType;
        const doc = new dom().parseFromString(udxStr);
        const dataset = xpath.select('/dataset', doc)[0];
        const level1Nodes = xpath.select('XDO/@name', dataset);
        const level1Names = [];
        _.map(level1Nodes, node => {
            level1Names.push((<any>node).value);
        });
        if (_.indexOf(level1Names, 'table') !== -1) {
            udxType = UDXType.TABLE;
        } else if (
            _.indexOf(level1Names, 'ShapeType') !== -1 &&
            _.indexOf(level1Names, 'FeatureCollection') !== -1 &&
            _.indexOf(level1Names, 'AttributeTable') !== -1 &&
            _.indexOf(level1Names, 'SpatialRef') !== -1
        ) {
            udxType = UDXType.SHAPEFILE;
        } else if (
            _.indexOf(level1Names, 'header') !== -1 &&
            _.indexOf(level1Names, 'bands') !== -1 &&
            _.indexOf(level1Names, 'projection') !== -1
        ) {
            udxType = UDXType.GRID;
        } else if (
            _.indexOf(level1Names, 'head') !== -1 &&
            _.indexOf(level1Names, 'body') !== -1
        ) {
            // ...
        } else {
            udxType = UDXType.UNKNOWN;
        }
        return resolve({
            type: udxType,
            UDX: udxStr
        });
    });
};