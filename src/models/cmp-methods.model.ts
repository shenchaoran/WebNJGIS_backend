import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'CmpMethod';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    md: String,
    IO: Schema.Types.Mixed
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ICmpMethodModel extends Model<ICmpMethodDocument>, IOgmsModel {}
export const CmpMethodModel: ICmpMethodModel = model<ICmpMethodDocument, ICmpMethodModel>(collectionName, schema);

export interface ICmpMethodDocument extends Document {
    meta: {
        name: string,
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
        time: number
    };
    IO: {
        schemas: any[],
        inputs: any[],
        outputs: any[]
    };
}

export enum CmpMethodEnum {
    TABLE_CHART,
    TABLE_STATISTIC,
    SHAPEFILE_VISUALIZATION,
    SHAPEFILE_STATISTIC,
    SHAPEFILE_INTERPOLATION,
    ASCII_GRID_VISUALIZATION,
    ASCII_GRID_STATISTIC,
    ASCII_GRID_BATCH_VISUALIZATION,
    GIF
}