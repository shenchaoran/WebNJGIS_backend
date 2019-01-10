/**
 * TODO 加上schema的详细结构
 * 
 */
import { OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import * as _ from 'lodash';
import { ResourceSrc } from './resource.enum';

const collectionName = 'Schema';
const schema = new Schema({
    id: String,
    name: String,
    description: String,
    src: String,
    structure: Schema.Types.Mixed,
}, {collection: collectionName});
Object.assign(schema.statics, OgmsSchemaStatics)

interface ISchemaModel extends Model<ISchemaDocument>, IOgmsModel {}
export const SchemaModel: ISchemaModel = model<ISchemaDocument, ISchemaModel>(collectionName, schema);


export interface ISchemaDocument extends Document {
    id: string;
    name: string;
    description: string;
    src: ResourceSrc;
    structure: NETCDF4_Schema & Table_Schema & Binary_Schema & Coordinate_Schama;
}

export enum SchemaName {
    TABLE_RAW = 0,
    SHAPEFILE_RAW,
    ASCII_GRID_RAW,
    ASCII_GRID_RAW_BATCH
};

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
    type: 'table' | 'obs-table';
    header: number;     // null: 列头  number: 第n行为列名  （不包括跳过的m行计数）
    skiprows: number;   // 跳过无用的行数
    seperator: string;  // 分隔符
    start?: number; 
    end?: number; 
    step?: number; 
    unit?: string;                   // "days since 1982-01-01"
    columns: {
        id: string,
        type: string,
        description: string,
        unit: string,
        scale: number,
        offset: number,
        missing_value: number,
    }[]
}

class Binary_Schema {
    type: 'binary';
}

class Coordinate_Schama {
    type: 'coordinate-index';
}