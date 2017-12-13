import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg } from '../models/UDX-cfg.class';
import { SchemaName } from '../models/UDX-schema.class';
import { UDXTableXML } from '../models/UDX-type.class';
import * as PropParser from './UDX.property.controller';

export const compare = (UDXs: Array<UDXCfg>): Promise<any> => {
    const types = _
        .chain(UDXs)
        .map(udxcfg => udxcfg.schema$.id)
        .value();
    const uniqTypes = _.uniq(types);    
    if (uniqTypes.length === 1) {
        let promise;
        if(uniqTypes[0] === SchemaName[SchemaName.TABLE_RAW]) {
            promise = compareRAWTable(UDXs);
        }
        else if(uniqTypes[0] === SchemaName[SchemaName.ASCII_GRID_RAW]) {
            promise = compareRAWAscii(UDXs);
        }
        else if(uniqTypes[0] === SchemaName[SchemaName.SHAPEFILE_RAW]) {
            promise = compareRAWShp(UDXs);
        }
        else {
            return Promise.reject(new Error('todo'));
        }
        return promise;
    }
    else {
        const err = new Error('Can\'t compare between different types of UDX!');
        return Promise.reject(err);
    }
}

const compareRAWTable = (UDXs: Array<UDXCfg>): Promise<any> => {
    return new Promise((resolve, reject) => {
        Promise.all(_.map(UDXs, PropParser.parse))
            .then(resolve)
            .catch(reject);
    });
}

const compareRAWAscii = (UDXs: Array<UDXCfg>): Promise<any> => {
    return ;
}

const compareRAWShp = (UDXs: Array<UDXCfg>): Promise<any> => {
    return ;
}