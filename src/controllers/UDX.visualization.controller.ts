import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import * as Promise from 'bluebird';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
const debug = require('debug');
const visualDebug = debug('WebNJGIS: Visualization');

import { UDXType, UDXTableXML } from '../models/UDX.type.model';
import * as StringUtils from '../utils/string.utils';
import {
    UDXCfg,
    UDXSchema,
    SchemaType,
    ExternalName
} from '../models/UDX.cfg.model';

export const parse = (data: { type: any; UDX?: any; udxcfg?: UDXCfg }): Promise<any> => {
    return new Promise((resolve, reject) => {
        let promiseFunc = undefined;
        switch (data.type) {
            case UDXType.TABLE_XML:
                promiseFunc = showXMLTable(data.UDX);
                break;
            case UDXType.TABLE_RAW:
                promiseFunc = showRAWTable(data.udxcfg);
                break;
            case UDXType.ASCII_GRID_XML:
                //...
                break;
        }
        promiseFunc
            .then(parsed => {
                return resolve({
                    type: data.type,
                    parsed: parsed
                });
            })
            .catch(reject);
    });
};

export const showXMLTable = (udxStr): Promise<UDXTableXML> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new dom().parseFromString(udxStr);
            const colNodes = xpath.select(
                "/dataset/XDO[@name='table']/XDO",
                doc
            );
            const table = new UDXTableXML();
            const rowsData: Array<any> = [];
            _.chain(colNodes)
                .map((colNode, colIndex) => {
                    const nameNode = xpath.select1('@name', colNode);
                    const kernelTypeNode = xpath.select1(
                        '@kernelType',
                        colNode
                    );
                    const valueNode = xpath.select1('@value', colNode);
                    let name = undefined;
                    let kernelType = undefined;
                    let value = undefined;

                    let column = undefined;
                    if (nameNode) {
                        name = nameNode.value;
                        column = {
                            data: name,
                            title: StringUtils.upper1st(name),
                            readOnly: true
                        };
                    }
                    if (kernelTypeNode) {
                        let type = kernelTypeNode.value;
                        type = type.split('_')[0];
                        kernelType = type;
                        // column.type = type;
                    }
                    table.columns.push(column);

                    if (valueNode) {
                        value = valueNode.value;
                        value = _.split(value, ';');
                        value = _.map(value, _.trim);
                        switch (kernelType) {
                            case 'string_array':
                                break;
                            case 'int_array':
                                value = _.map(value, parseInt);
                                break;
                            case 'real_array':
                                value = _.map(value, parseFloat);
                                break;
                        }
                        _.map(value, (td, rowIndex) => {
                            if (rowsData.length <= rowIndex) {
                                rowsData.push({});
                            }
                            _.set(rowsData[rowIndex], name, td);
                        });
                    }
                })
                .value();

            table.data = rowsData;
            return resolve(table);
        } catch (e) {
            return reject(e);
        }
    });
};

export const showRAWTable = (udxcfg: UDXCfg): Promise<UDXTableXML> => {
    return new Promise((resolve, reject) => {
        fs.readFile(udxcfg.entrance, (err, dataBuf) => {
            if(err) {
                return reject(err);
            }
            const dataStr = dataBuf.toString();
            const rowsStr = dataStr.split('\n');
            const rows = [];
            const rowsObj = [];
            const cols = [];
            _.map(rowsStr, (rowStr, i) => {
                if(rowStr.trim() !== '') {
                    rows.push(rowStr.split(','));
                }
            });
            _.map(rows[0], (th, i) => {
                if(rows[1][i].trim() !== '') {
                    rows[0][i] = `${th} (${rows[i][i]})`;
                }
                cols.push({
                    data: rows[0][i],
                    title: StringUtils.upper1st(rows[0][i]),
                    readOnly: true
                });
            });
            _.map(rows, (row, i) => {
                if(i !== 0 && i !== 1) {
                    const obj: any = {};
                    _.map(rows[0], (th, j) => {
                        _.set(obj, th, _.get(row, j));
                    });
                    rowsObj.push(obj);
                }
            });
            return resolve({
                data: rowsObj,
                columns: cols
            });
        });
    })
};
