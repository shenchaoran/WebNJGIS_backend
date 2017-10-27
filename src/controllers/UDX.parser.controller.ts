import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
const dataDebug = debug('WebNJGIS: data');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import { setting } from '../config/setting';
import { dataModel, GeoDataType, GeoData } from '../models/data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
import { UDXType, UDXTable } from '../models/UDX.type.model';

export const parseUDX = (req: Request, res: Response, next: NextFunction) => {
    dataDebug(req.params);
    const url = APIModel.getAPIUrl('download-geo-data', req.params);
    RequestCtrl.getByServer(url, undefined)
        .then(parseUDXType)
        .then(parseByType)
        .then(parsed => {
            res.locals.resData = parsed;
            res.locals.template = {};
            res.locals.succeed = true;
        })
        .catch(next);
};

// 对内部使用的常用UDX进行解析，其他格式暂不支持。
export const parseUDXType = (udxStr): Promise<{type: any; UDX: any}> => {
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

export const parseByType = (data): Promise<any> => {
    return new Promise((resolve, reject) => {
        let parsed;
        switch (data.type) {
            case UDXType.TABLE: 
                parsed = parseTable(data.UDX);
                break;
            case UDXType.ASCII_GRID:
                //... 
                break;
        }
        return resolve(parsed);
    });
};

export const parseTable = (udxStr): UDXTable => {
    const doc = new dom().parseFromString(udxStr);
    const colNodes = xpath.select('/dataset/XDO[@name=\'table\']/XDO', doc);
    const table = new UDXTable();
    const cols = [];
    let rowsNum = 0;
    const colsNum = colNodes.length;
    _
        .chain(colNodes)
        .map(colNode => {
            const nameNode = xpath.select1('@name', colNode);
            const kernelTypeNode = xpath.select1('@kernelType', colNode);
            const valueNode = xpath.select1('@value', colNode);
            let name = undefined;
            let kernelType = undefined;
            let value = undefined;
            if(nameNode) {
                name = nameNode.value;
                table.header.push(name);
            }
            if(kernelTypeNode) {
                kernelType = kernelTypeNode.value;
                table.types.push(kernelType);
            }
            if(valueNode) {
                value = valueNode.value;
                value = _.split(value, ';');
                switch (kernelType) {
                    case 'string_array':
                        break;
                    case 'int_array':
                        value = _.map(value, parseInt)
                        break;
                    case 'real_array':
                        value = _.map(value, parseFloat);
                        break;
                }
                if(value.length > rowsNum) {
                    rowsNum = value.length;
                }
                cols.push(value);
            }
        })
        .value();

    _.map(cols, (col, colIndex) => {
        _.map(col, (td, rowIndex) => {
            if(table.body.length <= rowIndex) {
                table.body.push([]);
            }
            table.body[rowIndex].push(col[rowIndex]);
        })
    });
    table.colCount = colsNum;
    table.rowCount = rowsNum;
    return table;
};