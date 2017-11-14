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
import {
    DataModelInstance,
    GeoDataType,
    GeoDataClass
} from '../models/data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
import { UDXType, UDXTableXML } from '../models/UDX.type.model';
import * as StringUtils from '../utils/string.utils';
import * as PropParser from './UDX.property.controller';
import * as VisualParser from './UDX.visualization.controller';

export const parseUDXProp = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

export const parseUDXVisual = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    dataDebug(req.params);
    const url = APIModel.getAPIUrl('download-geo-data', req.params);
    RequestCtrl.getByServer(url, undefined, true)
        .then(parseUDXType)
        .then(VisualParser.parse)
        .then(parsed => {
            res.locals.resData = parsed;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

// 确保存在数据
// zip形式的时候存在解压后的文件夹
// xml形式的存在文件
// const requsetData = (gdid) => {
//     return new Promise((resolve, reject) => {
//         DataModelInstance.find({gdid: gdid})
//             .then(gd => {
//                 if(gd.length) {
//                     gd = gd[0];
//                     const fpath = path.join(setting.uploadPath, 'geo_data', gd.path);
//                     fs.stat(fpath, (err, stats) => {
//                         if(err) {
//                             if(err.code === 'ENOENT') {
//                                 downloadRmtData();
//                             }
//                             return reject(err);
//                         }
//                         else {
//                             fs.readFile(fpath, (err, data) => {
//                                 if(err) {
//                                     return reject(err);
//                                 }
//                                 else {
//                                     res.set({
//                                         'Content-Type': 'file/xml',
//                                         'Content-Length': data.length,
//                                         'Content-Disposition': 'attachment;filename=' + encodeURIComponent(req.query.filename)
//                                     });
//                                     return res.end(data);
//                                 }
//                             });
//                         }
//                     });
//                 }
//                 else {
//                     downloadRmtData();
//                 }
//             })
//             .catch(err => reject(err));
//     });
// }

// 对内部使用的常用UDX进行解析，其他格式暂不支持。
// TODO schema数据库
const parseUDXType = (response): Promise<{ type: any; UDX: any }> => {
    if(_.startsWith(response.statusCode, '200')) {
        const resHeaders = response.headers;
        const hName = resHeaders['content-disposition'];
        const fName = hName.substr(hName.indexOf('filename=') + 9);
        const extName = fName.substr(fName.indexOf('.') + 1);
        if(extName === 'xml') {
            const udxStr = response.body;
            return new Promise((resolve, reject) => {
                try {
                    let udxType;
                    const doc = new dom().parseFromString(udxStr);
                    const dataset = xpath.select('/dataset', doc)[0];
                    const level1Nodes = xpath.select('XDO/@name', dataset);
                    const level1Names = [];
                    _.map(level1Nodes, node => {
                        level1Names.push((<any>node).value);
                    });
                    if (_.indexOf(level1Names, 'table') !== -1) {
                        udxType = UDXType.TABLE_XML;
                    } else if (
                        _.indexOf(level1Names, 'ShapeType') !== -1 &&
                        _.indexOf(level1Names, 'FeatureCollection') !== -1 &&
                        _.indexOf(level1Names, 'AttributeTable') !== -1 &&
                        _.indexOf(level1Names, 'SpatialRef') !== -1
                    ) {
                        udxType = UDXType.SHAPEFILE_XML;
                    } else if (
                        _.indexOf(level1Names, 'header') !== -1 &&
                        _.indexOf(level1Names, 'bands') !== -1 &&
                        _.indexOf(level1Names, 'projection') !== -1
                    ) {
                        udxType = UDXType.GRID_XML;
                    } else if (
                        _.indexOf(level1Names, 'head') !== -1 &&
                        _.indexOf(level1Names, 'body') !== -1
                    ) {
                        // ...
                    } else {
                        udxType = UDXType.UNKNOWN_XML;
                    }
                    return resolve({
                        type: udxType,
                        UDX: udxStr
                    });
                } catch (e) {
                    dataDebug(e);
                    return reject(e);
                }
            });
        }
        else if(extName === 'zip') {

        }
    }
    else {
        return Promise.reject(undefined);
    }
};
