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
    structure?: NETCDF4_Schema | Table_Schema | Binary_Schema | Coordinate_Schama;
    semantic?: {
        concepts: any[],
        spatialRefs: any[],
        units: any[],
        dataTemplates: any[]
    };
}

class SchemaStructure { 
    type: 'table' | 'ascii' | 'radio' | 'checkbox' | 'date' | 'coordinate' | 'NETCDF4';
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
    // NETCDF4
    dimensions: any[];
    variables: any[];
}


class NETCDF4_Schema {
    type: 'NETCDF4';
    dimensions: {
        name: string,
        [key: string]: any,
    }[];
    variables: {
        name: string,
        layerId?: string,
        metricName: string,
        scale?: number,
        offset?: number,
        start?: number,
        end?: number,
        step?: number,
        unit?: string,
        dimensions?: string[],
    }[];
}

class Table_Schema {
    type: 'table';
    headers: number;
    rowStart: number;
    seperator: string;
    columns: {
        id: string,
        type: string,
        description: string,
        unit: string,
        unitScale: number,
    }[]
}

class Binary_Schema {
    type: 'binary';
}

class Coordinate_Schama {
    type: 'coordinate-index';
}