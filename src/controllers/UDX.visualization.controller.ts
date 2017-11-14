import * as _ from 'lodash';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
import * as Promise from 'bluebird';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
const visualDebug = debug('WebNJGIS: Visualization');

import { UDXType, UDXTableXML } from '../models/UDX.type.model';
import * as StringUtils from '../utils/string.utils';

export const parse = (data): Promise<any> => {
    return new Promise((resolve, reject) => {
        let parsed;
        switch (data.type) {
            case UDXType.TABLE_XML: 
                parsed = showTable(data.UDX);
                break;
            case UDXType.ASCII_GRID_XML:
                //... 
                break;
        }
        return resolve({
            type: data.type,
            parsed: parsed
        });
    });
}

export const showTable = (udxStr): UDXTableXML => {
    const doc = new dom().parseFromString(udxStr);
    const colNodes = xpath.select('/dataset/XDO[@name=\'table\']/XDO', doc);
    const table = new UDXTableXML();
    const rowsData: Array<any> = [];
    _
        .chain(colNodes)
        .map((colNode, colIndex) => {
            const nameNode = xpath.select1('@name', colNode);
            const kernelTypeNode = xpath.select1('@kernelType', colNode);
            const valueNode = xpath.select1('@value', colNode);
            let name = undefined;
            let kernelType = undefined;
            let value = undefined;

            let column = undefined;
            if(nameNode) {
                name = nameNode.value;
                column = {
                    data: name,
                    title: StringUtils.upper1st(name),
                    readOnly: true
                };
            }
            if(kernelTypeNode) {
                let type = kernelTypeNode.value;
                type = type.split('_')[0];
                kernelType = type;
                // column.type = type;
            }
            table.columns.push(column);

            if(valueNode) {
                value = valueNode.value;
                value = _.split(value, ';');
                value = _.map(value, _.trim);
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
                _.map(value, (td, rowIndex) => {
                    if(rowsData.length <= rowIndex) {
                        rowsData.push({});
                    }
                    _.set(rowsData[rowIndex], name, td);
                });
            }
        })
        .value();

    table.data = rowsData;
    return table;
};