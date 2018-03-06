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
        isExample?: boolean,
        desc?: string,
        // 两种表达：geojson 和 grid
        // 两种类型：point 和 polygon
        spatial?: {
                    dimension: 'point' | 'polygon',
                    geojson: any
                } | {
                    dimension: 'point',
                    point: {
                        lat: string,
                        long: string
                    }
                } | {
                    dimension: 'polygon',
                    polygon: {
                        xllcorner: number,
                        yllcorner: number,
                        xsize: number,
                        ysize: number,
                        ncols: number,
                        nrows: number,
                        NODATA_value: number,
                        unit: string
                    }
                },
        temporal: {
            // [start, end]
            // 两种情况：区间 和 点。点的时候 start = end
            // start, end 以 'yyMMdd' 形式，具体到哪一位随 'scale' 变化
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
            spatial: {
                dimension: undefined,
                geojson: undefined,
                point: undefined,
                polygon: undefined
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