import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import * as fs from 'fs';

import { UDXType, UDXTableXML } from '../models/UDX.type.model';
import * as StringUtils from '../utils/string.utils';
const debug = require('debug');
const propDebug = debug('WebNJGIS: Property');
import * as ArrayUtils from '../utils/array.utils';
import {
    UDXCfg,
    UDXSchema,
    SchemaType,
    ExternalName
} from '../models/UDX.cfg.model';
import * as VisualParser from './UDX.visualization.controller';

export const parse = (data: { type: any; UDX?: any; udxcfg?: UDXCfg }): Promise<any> => {
    return new Promise((resolve, reject) => {
        let promiseFunc = undefined;
        switch (data.type) {
            case UDXType.TABLE_XML:
                promiseFunc = parseXMLTableProp(data.UDX);
                break;
            case UDXType.TABLE_RAW:
                promiseFunc = new Promise((resolve, reject) => {
                    Promise.all([
                        parseRAWTableProp(data.udxcfg),
                        VisualParser.showRAWTable(data.udxcfg)
                    ])
                        .then(rsts => {
                            return resolve ({
                                prop: rsts[0],
                                show: rsts[1]
                            });
                        })
                        .catch(reject);
                });
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

const parseXMLTableProp = (udxStr): Promise<UDXTableXML> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new dom().parseFromString(udxStr);
            const colNodes = xpath.select(
                "/dataset/XDO[@name='table']/XDO",
                doc
            );
            const table = new UDXTableXML();
            const rowsData: Array<any> = [];

            table.columns = [
                {
                    data: 'name',
                    title: 'Name',
                    readOnly: true
                },
                {
                    data: 'type',
                    title: 'Type',
                    readOnly: true
                },
                {
                    data: 'min',
                    title: 'Minimum',
                    readOnly: true
                },
                {
                    data: 'max',
                    title: 'Maximum',
                    readOnly: true
                },
                {
                    data: 'mean',
                    title: 'Mean',
                    readOnly: true
                },
                {
                    data: 'stdDev',
                    title: 'Standard Deviation',
                    readOnly: true
                },
                {
                    data: 'sum',
                    title: 'Sum',
                    readOnly: true
                }
            ];
            table.data = [];
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
                    let max = undefined;
                    let min = undefined;
                    let mean = undefined;
                    let stdDev = undefined;
                    let sum = undefined;

                    if (nameNode) {
                        name = nameNode.value;
                    }
                    if (kernelTypeNode) {
                        let type = kernelTypeNode.value;
                        type = type.split('_')[0];
                        kernelType = type;
                        // column.type = type;
                    }

                    if (valueNode) {
                        value = valueNode.value;
                        value = _.split(value, ';');
                        value = _.map(value, _.trim);
                        switch (kernelType) {
                            case 'string':
                                value = _.map(value, parseFloat);
                                break;
                            case 'int':
                                value = _.map(value, parseInt);
                                break;
                            case 'real':
                                value = _.map(value, parseFloat);
                                break;
                        }
                        mean = _.mean(value);
                        max = (<number>_.max(value));
                        min = (<number>_.min(value));
                        sum = _.sum(value);
                        stdDev = ArrayUtils.stdDev(value);
                    }

                    table.data.push({
                        name: name,
                        type: kernelType,
                        min: min,
                        max: max,
                        mean: mean,
                        stdDev: stdDev,
                        sum: sum
                    });
                })
                .value();
            return resolve(table);
        } catch (e) {
            return reject(e);
        }
    });
};

const parseRAWTableProp = (udxcfg: UDXCfg): Promise<UDXTableXML> => {
    return new Promise((resolve, reject) => {
        fs.readFile(udxcfg.entrance, (err, dataBuf) => {
            if (err) {
                return reject(err);
            }
            const table = new UDXTableXML();
            table.columns = [
                {
                    data: 'name',
                    title: 'Name',
                    readOnly: true
                },
                {
                    data: 'unit',
                    title: 'Unit',
                    readOnly: true
                },
                {
                    data: 'min',
                    title: 'Minimum',
                    readOnly: true
                },
                {
                    data: 'max',
                    title: 'Maximum',
                    readOnly: true
                },
                {
                    data: 'mean',
                    title: 'Mean',
                    readOnly: true
                },
                {
                    data: 'stdDev',
                    title: 'Standard Deviation',
                    readOnly: true
                },
                {
                    data: 'sum',
                    title: 'Sum',
                    readOnly: true
                }
            ];
            table.data = [];
            const dataStr = dataBuf.toString();
            const rowsStr = dataStr.split('\n');
            const rows = [];
            const rowObj = [];
            // th + unit
            _.map(rowsStr, (rowStr, i) => {
                if (rowStr.trim() !== '') {
                    rows.push(rowStr.split(','));
                }
            });
            // th
            _.map(rows[0], (th, i) => {
                if (rows[1][i].trim() !== '') {
                    rows[0][i] = `${th} (${rows[i][i]})`;
                }
            });
            // 转置 table body
            const ths = _.remove(rows, (row, i) => i === 0);
            const units = _.remove(rows, (row, i) => i === 0);
            const transed = [];
            for (let i = 0; i < rows.length; i++) {
                for (let j = 0; j < rows[i].length; j++) {
                    if (transed.length <= j) {
                        transed.push([]);
                    }

                    transed[j].push(parseFloat(rows[i][j]));
                }
            }
            // 统计
            _.map(transed, (row, i) => {
                table.data.push({
                    name: ths[0][i],
                    unit: units[0][i],
                    min: (<number>_.min(row)),
                    max: (<number>_.max(row)),
                    mean: _.mean(row),
                    stdDev: ArrayUtils.stdDev(row),
                    sum: _.sum(row)
                });
            });
            return resolve(table);
        });
    });
};
