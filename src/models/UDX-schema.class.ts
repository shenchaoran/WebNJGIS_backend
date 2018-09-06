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
    msId?: string;
    id: string;
    src: ResourceSrc;
    name?: string;
    description?: string;
    structure?: SchemaStructure;
    semantic?: {
        concepts: any[],
        spatialRefs: any[],
        units: any[],
        dataTemplates: any[]
    };
}

class SchemaStructure { 
    type: 'table' | 'ascii' | 'radio' | 'checkbox' | 'date' | 'coordinate';
    // table
    columns?: {
        id: string,
        type: string,
        description: string,
        unit: string
    }[];
    // ascii
    spatial?: {

    };
    temporal?: {

    };
    // radio, checkbox: 单选多选的参数
    options: string[];
    // date：日期类型的输入
    // coordinate：坐标类型的输入
}