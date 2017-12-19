/**
 * 和数据实体性关联。由于UDX脱离了MDL后不清楚器内部结构，所以附加一个cfg文件解释其结构
 */

import * as _ from 'lodash';
import { UDXSchema } from '../models/UDX-schema.class';

import { ResourceSrc } from './resource.enum';

export class UDXCfg {
    elements?: {
        entrance: string,
        entries: string[]
    };
    meta: {
        desc?: string,
        isExample: boolean,
        type: 'point' | 'polygon' | 'multi-point',
        isOutput?: boolean,
        spatial?: {
            // point
            point?: any,
            // polygon
            // ncols?: number,
            // nrows?: number,
            // yllcorner?: number,
            // xllcorner?: number,
            // cellsize?: number,
            // NODATA_value?: number
            polygon?: any
        },

        // point
        temporal: {
            start: number,
            end: number,
            scale: 'YEAR' | 'DAY'
        },

        // polygon
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
            type: undefined,
            isOutput: false,
            spatial: {
                point: {},
                polygon: {}
            },
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