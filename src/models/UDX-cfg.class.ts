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
            position?: {
                lat: string,
                long: string
            },
            // polygon
            ncols?: number,
            nrows?: number,
            yllcorner?: number,
            xllcorner?: number,
            cellsize?: number,
            NODATA_value?: number
        },

        // point
        temporal: {
            start: number,
            end: number,
            scale: 'YEAR' | 'DAY'
        },

        // polygon
        feature?: string,
        date?: string
    };
    schema$?: UDXSchema;
}