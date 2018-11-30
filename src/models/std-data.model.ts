import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';

const collectionName = 'STD_Data';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    models: Schema.Types.Mixed,
    schema$: Schema.Types.Mixed,
    tags: [String],
    topic: String,
    entries: Schema.Types.Mixed,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ISTDDataModel extends Model<ISTDDataDocument>, IOgmsModel {}
export const StdDataModel: ISTDDataModel = model<ISTDDataDocument, ISTDDataModel>(collectionName, schema);

interface ISTDDataDocument extends Document {
    meta: {
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
        name: string
    };
    models: string[];
    schema$: any;
    // 数据存储位置：以 _id.ext 为文件名，需要在 geoserver 和 upload/geo-data 各存一份。（如果可以通过 geoserver 直接下载就不用这么做了！）
    entries: {
        name: string,
        path: string,
        [key: string]: any,
    }[];
    tags: string[];
}