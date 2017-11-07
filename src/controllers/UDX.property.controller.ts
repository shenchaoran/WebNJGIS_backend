import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

import { UDXType, UDXTable } from '../models/UDX.type.model';
import * as StringUtils from '../utils/string.utils';
const propDebug = debug('WebNJGIS: Property');
import * as ArrayUtils from '../utils/array.utils';

export const parse = (data): Promise<any> => {
    return new Promise((resolve, reject) => {
        let parsed;
        switch (data.type) {
            case UDXType.TABLE: 
                parsed = parseTableProp(data.UDX);
                break;
            case UDXType.ASCII_GRID:
                //... 
                break;
        }
        return resolve({
            type: data.type,
            parsed: parsed
        });
    });
};

const parseTableProp = (udxStr): UDXTable => {
    const doc = new dom().parseFromString(udxStr);
    const colNodes = xpath.select('/dataset/XDO[@name=\'table\']/XDO', doc);
    const table = new UDXTable();
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
        },
    ];
    table.data = [];
    _
        .chain(colNodes)
        .map((colNode, colIndex) => {
            const nameNode = xpath.select1('@name', colNode);
            const kernelTypeNode = xpath.select1('@kernelType', colNode);
            const valueNode = xpath.select1('@value', colNode);
            let name = undefined;
            let kernelType = undefined;
            let value = undefined;
            let max = undefined;
            let min = undefined;
            let mean = undefined;
            let stdDev = undefined;
            let sum = undefined;

            if(nameNode) {
                name = nameNode.value;
            }
            if(kernelTypeNode) {
                let type = kernelTypeNode.value;
                type = type.split('_')[0];
                kernelType = type;
                // column.type = type;
            }

            if(valueNode) {
                value = valueNode.value;
                value = _.split(value, ';');
                value = _.map(value, _.trim);
                switch (kernelType) {
                    case 'string':
                        value = _.map(value, parseFloat);
                        break;
                    case 'int':
                        value = _.map(value, parseInt)
                        break;
                    case 'real':
                        value = _.map(value, parseFloat);
                        break;
                }
                mean = _.mean(value).toFixed(2);
                max = (<number>_.max(value)).toFixed(2);
                min = (<number>_.min(value)).toFixed(2);
                sum = _.sum(value).toFixed(2);
                stdDev = ArrayUtils.stdDev(value).toFixed(2);
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
    return table;
};