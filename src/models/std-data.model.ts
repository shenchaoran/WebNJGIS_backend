import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';

const collectionName = 'STD_Data';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    // getter: String,
    models: Schema.Types.Mixed,
    inputPath: String,
    outputPath: String,
    // stdClass: String,
    content: Schema.Types.Mixed
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
    inputPath: string;
    outputPath: string;
    // stdClass: string;
    content: {
        [key: string]: any
    };
}