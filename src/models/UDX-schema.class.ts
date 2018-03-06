/**
 * TODO 加上schema的详细结构
 * 
 */

import * as _ from 'lodash';
import { ResourceSrc } from './resource.enum';

export enum SchemaName {
    TABLE_RAW = 0,
    SHAPEFILE_RAW,
    ASCII_GRID_RAW,
    ASCII_GRID_RAW_BATCH
};

export class UDXSchema {
    // 外部时为ObjectID，内部时为name
    // id在UDX中是可选的，在MDL中是必选的
    id?: string;
    src: ResourceSrc;
    // SchemaName
    // 如果是以上几种数据结构，暂时不在structure和semantic中具体说明结构
    type: string;
    description?: string;
    structure?: any[];
    semantic?: {
        concepts: any[],
        spatialRefs: any[],
        units: any[],
        dataTemplates: any[]
    };
}