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
import { UDXSchema, SchemaSrc, UDXCfg } from '../models/UDX-schema.class';

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

// region deprecated
// 对内部使用的常用UDX进行解析，其他格式暂不支持。
// TODO schema数据库
// export const parseUDXType = (doc): Promise<{ type: any; udxcfg: UDXCfg }> => {
//     // if (doc.type === GeoDataType.UDX) {
//     //     // deprecated
//     //     const fpath = path.join(setting.uploadPath, 'geo-data', doc.path);
//     //     return new Promise((resolve, reject) => {
//     //         fs.readFile(fpath, (err, udxBuffer) => {
//     //             if (err) {
//     //                 return Promise.reject(err);
//     //             } else {
//     //                 try {
//     //                     const udxStr = udxBuffer.toString();
//     //                     let udxType;
//     //                     const doc = new dom().parseFromString(udxStr);
//     //                     const dataset = xpath.select('/dataset', doc)[0];
//     //                     const level1Nodes = xpath.select('XDO/@name', dataset);
//     //                     const level1Names = [];
//     //                     _.map(level1Nodes, node => {
//     //                         level1Names.push((<any>node).value);
//     //                     });
//     //                     if (_.indexOf(level1Names, 'table') !== -1) {
//     //                         udxType = UDXType.TABLE_XML;
//     //                     } else if (
//     //                         _.indexOf(level1Names, 'ShapeType') !== -1 &&
//     //                         _.indexOf(level1Names, 'FeatureCollection') !==
//     //                             -1 &&
//     //                         _.indexOf(level1Names, 'AttributeTable') !== -1 &&
//     //                         _.indexOf(level1Names, 'SpatialRef') !== -1
//     //                     ) {
//     //                         udxType = UDXType.SHAPEFILE_XML;
//     //                     } else if (
//     //                         _.indexOf(level1Names, 'header') !== -1 &&
//     //                         _.indexOf(level1Names, 'bands') !== -1 &&
//     //                         _.indexOf(level1Names, 'projection') !== -1
//     //                     ) {
//     //                         udxType = UDXType.GRID_XML;
//     //                     } else if (
//     //                         _.indexOf(level1Names, 'head') !== -1 &&
//     //                         _.indexOf(level1Names, 'body') !== -1
//     //                     ) {
//     //                         // ...
//     //                     } else {
//     //                         udxType = UDXType.UNKNOWN_XML;
//     //                     }
//     //                     return resolve({
//     //                         type: udxType,
//     //                         UDX: udxStr
//     //                     });
//     //                 } catch (e) {
//     //                     dataDebug(e);
//     //                     return reject(e);
//     //                 }
//     //             }
//     //         });
//     //     });
//     // } else if (doc.type === GeoDataType.RAW) {
//         // TODO
//         const fname = doc.path;
//         const folderName = fname.substring(0, fname.lastIndexOf('.'));
//         const folderPath = path.join(
//             setting.uploadPath,
//             'geo-data',
//             folderName
//         );
//         const cfgPath = path.join(folderPath, 'index.config');
//         return new Promise((resolve, reject) => {
//             parseUDXCfg(cfgPath)
//                 .then(udxcfg => {
//                     return resolve({
//                         type: External[udxcfg.schema$.externalName],
//                         udxcfg: udxcfg
//                     });
//                 })
//                 .catch(reject);
//         });
//     // }
// };
// endregion

export const parseUDXCfg = (cfgPath: string): Promise<UDXCfg> => {
    const folderPath = cfgPath.substring(0, cfgPath.lastIndexOf('index.config'));
    return new Promise((resolve, reject) => {
        fs.readFile(cfgPath, (err, dataBuf) => {
            if (err) {
                return reject(err);
            }
            try {
                const udxCfg = new UDXCfg();
                const cfgStr = dataBuf.toString();
                const doc = new dom().parseFromString(cfgStr);
                const rootNode = xpath.select('/UDXZip', doc)[0];
                const schemaNode = xpath.select('Schema', rootNode)[0];
                const schema = new UDXSchema();
                udxCfg.schema$ = schema;
                schema.type = <any>SchemaSrc[xpath.select('@type', schemaNode)[0].value];
                if (schema.type === SchemaSrc.external) {
                    schema.externalId = xpath.select(
                        '@externalId',
                        schemaNode
                    )[0].value;
                    schema.externalName = xpath.select(
                        '@externalName',
                        schemaNode
                    )[0].value;
                } else if (schema.type === SchemaSrc.internal) {
                    // TODO
                }
                udxCfg.entrance = xpath.select(
                    'Entrance/@value',
                    rootNode
                )[0].value;
                udxCfg.entrance = path.join(folderPath, udxCfg.entrance)
                const formatNodes = xpath.select('Format/@value', rootNode);
                if(formatNodes.length) {
                    udxCfg.format = formatNodes[0].value;
                }
                const entriesNodes = xpath.select(
                    'Entries/add/@value',
                    rootNode
                );
                if (entriesNodes.length) {
                    udxCfg.entries = _.map(
                        entriesNodes,
                        entriesNode => path.join(folderPath, (<any>entriesNode).value)
                    );
                }
                return resolve(udxCfg);
            } catch (e) {
                return reject(e);
            }
        });
    });
};
