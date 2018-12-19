import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import * as fs from 'fs';
import * as path from 'path';
import * as Bluebird from 'bluebird';
import { setting } from '../config/setting';

import { UDXType, UDXTableXML } from '../models/UDX-type.class';
import * as StringUtils from '../utils/string.utils';
const debug = require('debug');
const propDebug = debug('WebNJGIS: Property');
import * as ArrayUtils from '../utils/array.utils';
import { UDXCfg, GeoDataModel, OGMSState } from '../models';
import { SchemaName } from '../models/UDX-schema.class';

export const parse = (dataId: string): Bluebird<any> => {
    return new Bluebird((resolve, reject) => {
        GeoDataModel.findOne({ _id: dataId })
            .then(doc => {
                const udxcfg = doc.udxcfg;
                let promiseFunc = undefined;
                if (udxcfg.schema$.id === SchemaName[SchemaName.TABLE_RAW]) {
                    promiseFunc = parseRAWTableProp(doc);
                }
                else if (udxcfg.schema$.id === SchemaName[SchemaName.ASCII_GRID_RAW]) {
                    promiseFunc = parseRAWAsciiProp(doc);
                }
                else if (udxcfg.schema$.id === SchemaName[SchemaName.SHAPEFILE_RAW]) {
                    promiseFunc = parseRAWShpProp(doc);
                }
                else {
                    return resolve(new Error('todo'));
                }

                promiseFunc
                    .then(parsed => {
                        return resolve({
                            type: udxcfg.schema$.id,
                            parsed: parsed
                        });
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
};

export const parseRAWTableProp = (geodata: any): Bluebird<any> => {
    return
};

export const parseRAWAsciiProp = (geodata: any): Bluebird<any> => {
    return;
};

export const parseRAWShpProp = (geodata: any): Bluebird<any> => {
    return;
};

////////////////////////////////////////////////////////////////////////////////

export const statisticRAWShp = (doc: any): Bluebird<any> => {
    return
}

export const statisticRAWAscii = (doc: any): Bluebird<any> => {
    return
}

export const statisticTableRow = (doc: any, field?: string): Bluebird<any> => {
    const udxcfg = doc.udxcfg;
    return new Bluebird((resolve, reject) => {
        const fPath = path.join(
            setting.geo_data.path,
            doc.meta.path,
            udxcfg.entrance
        );
        fs.readFile(fPath, (err, buf) => {
            if (err) {
                return reject(err);
            }
            else {
                const dataStr = buf.toString();
                const rowsStr = dataStr.split(/\r\n|\r|\n/g);
                const rows = [];
                const rowsObj = [];
                const cols = [];
                _.map(rowsStr, (rowStr, i) => {
                    if (rowStr.trim() !== '') {
                        if (i === 0) {
                            rows.push(_.map(rowStr.split(','), item => {
                                return item;
                            }));
                        }
                        else {
                            rows.push(_.map(rowStr.split(','), item => {
                                return parseFloat(item);
                            }));
                        }
                    }
                });

                // 列名
                let ths = _.remove(rows, (row, i) => i === 0);
                ths = ths[0];
                let index;
                _.map(ths, (td, i) => {
                    if (td === field) {
                        index = i;
                    }
                });

                const col = [];
                if (index) {
                    _.map(rows, row => {
                        col.push(row[index]);
                    });
                }

                // const table = new UDXTableXML();
                // table.columns = [
                //     {
                //         data: 'name',
                //         title: 'Name',
                //         readOnly: true
                //     },
                //     {
                //         data: 'min',
                //         title: 'Minimum',
                //         readOnly: true
                //     },
                //     {
                //         data: 'max',
                //         title: 'Maximum',
                //         readOnly: true
                //     },
                //     {
                //         data: 'mean',
                //         title: 'Mean',
                //         readOnly: true
                //     },
                //     {
                //         data: 'stdDev',
                //         title: 'Standard Deviation',
                //         readOnly: true
                //     },
                //     {
                //         data: 'sum',
                //         title: 'Sum',
                //         readOnly: true
                //     }
                // ];
                // table.data.push({
                //     name: ths[0][index],
                //     min: <number>_.min(col),
                //     max: <number>_.max(col),
                //     mean: _.mean(col),
                //     stdDev: ArrayUtils.stdDev(col),
                //     sum: _.sum(col)
                // });
                const statisCol = [
                    ths[index],
                    <number>_.min(col),
                    <number>_.max(col),
                    _.mean(col),
                    ArrayUtils.stdDev(col),
                    _.sum(col)
                ];

                return resolve({
                    statistic: {
                        row: statisCol,
                        progress: 100
                    }
                });
            }
        });
    });
}

// TODO
export const statisticRAWTable = (doc: any): Bluebird<any> => {
    const udxcfg = doc.udxcfg;
    return new Bluebird((resolve, reject) => {
        const fPath = path.join(
            setting.geo_data.path,
            doc.meta.path,
            udxcfg.entrance
        );
        fs.readFile(fPath, (err, dataBuf) => {
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
            // _.map(rows[0], (th, i) => {
            //     if (rows[1][i].trim() !== '') {
            //         rows[0][i] = `${th} (${rows[i][i]})`;
            //     }
            // });

            // 移除表头
            const ths = _.remove(rows, (row, i) => i === 0);
            // const units = _.remove(rows, (row, i) => i === 0);

            // 转置 table body
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
                    // unit: unit[0][i],
                    min: <number>_.min(row),
                    max: <number>_.max(row),
                    mean: _.mean(row),
                    stdDev: ArrayUtils.stdDev(row),
                    sum: _.sum(row)
                });
            });
            return resolve({
                statistic: {
                    tableSrc: table,
                    progress: 100
                }
            });
        });
    });
}