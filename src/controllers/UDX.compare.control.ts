import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import {
    UDXCfg,
    UDXSchema,
    SchemaType,
    ExternalName
} from '../models/UDX.cfg.model';
import { UDXType, UDXTableXML } from '../models/UDX.type.model';
import * as PropParser from './UDX.property.controller';
import { resolve } from 'path';

export const compare = (UDXs: Array<{ type: any; UDX?: any; udxcfg?: UDXCfg }>): Promise<any> => {
    const types = _
        .chain(UDXs)
        .map(UDX => _.get(UDX, 'type'))
        .value();
    const uniqTypes = _.uniq(types);    
    if (uniqTypes.length === 1) {
        let promise;
        switch(uniqTypes[0]) {
            case UDXType.TABLE_RAW:
                promise = compareRAWTable(UDXs);
                break;
            case UDXType.TABLE_XML:
                console.log('TODO!');
                break;
        }
        return promise;
    }
    else {
        const err = new Error('Can\'t compare between different types of UDX!');
        return Promise.reject(err);
    }
}

const compareRAWTable = (UDXs: Array<{ type: any; UDX?: any; udxcfg?: UDXCfg }>): Promise<any> => {
    return new Promise((resolve, reject) => {
        Promise.all(_.map(UDXs, PropParser.parse))
            .then(resolve)
            .catch(reject);
    })
}