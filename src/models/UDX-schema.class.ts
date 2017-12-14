/**
 * TODO 加上schema的详细结构
 * 
 */

import * as _ from 'lodash';
import { ResourceSrc } from './resource.enum';

export enum SchemaName {
    TABLE_RAW,
    SHAPEFILE_RAW,
    ASCII_GRID_RAW
};

export class UDXSchema {
    // 外部时为ObjectID，内部时为name
    // id在UDX中是可选的，在MDL中是必选的
    id?: string;
    src: ResourceSrc;
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