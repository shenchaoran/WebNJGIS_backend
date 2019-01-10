import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ISchemaDocument } from './UDX-schema.model';
import { UDXCfg } from './UDX-cfg.class';
import { ResourceSrc } from './resource.enum';

const collectionName = 'Geo_Data';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    auth: Schema.Types.Mixed,
    udxcfg: Schema.Types.Mixed
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface IGeoDataModel extends Model<IGeoDataDocument>, IOgmsModel {}
export const GeoDataModel: IGeoDataModel = model<IGeoDataDocument, IGeoDataModel>(collectionName, schema);

export interface IGeoDataDocument extends Document {
    meta?: {
        name: string,
        path: string,
        desc: string
    };

    auth: {
        userId: string,
        src: ResourceSrc
    };

    udxcfg: UDXCfg;
}

export enum STD_DATA_FEATURE {
    TA = 0,
    TMIN,
    TMAX,
    CLOUD,
    RH,
    PS,
    PREC,
    WIND
}
