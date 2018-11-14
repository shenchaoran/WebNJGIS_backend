import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'Site';
const schema = new Schema({
    x: Number,
    y: Number,
    index: Number
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ISiteModel extends Model<ISiteDocument>, IOgmsModel {}
export const SiteModel: ISiteModel = model<ISiteDocument, ISiteModel>(collectionName, schema);

interface ISiteDocument extends Document {
    x: number;
    y: number;
    index: number;
}