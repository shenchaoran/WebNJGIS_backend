/**
 * 和数据实体性关联。由于UDX脱离了MDL后不清楚器内部结构，所以附加一个cfg文件解释其结构
 */

import * as _ from 'lodash';
import { UDXSchema } from '../models/UDX-schema.class';

import { ResourceSrc } from './resource.enum';

export class UDXCfg {
    elements?: {
        entrance?: string,
        entries?: string[]
    };
    meta: {
        desc?: string,
        isExample?: boolean,
        spatial?: any,
        temporal: {
            // [start, end]
            start?: string,
            end?: string,
            scale: 'YEAR' | 'DAY'
        },
        feature?: string
    };
    schema$?: UDXSchema;

    constructor() {
        this.elements = {
            entrance: undefined,
            entries: []
        };
        this.meta = {
            desc: undefined,
            isExample: false,
            spatial: {},
            temporal: {
                start: undefined,
                end: undefined,
                scale: 'DAY'
            },
            feature: undefined
        };
        this.schema$ = undefined;
    }
}