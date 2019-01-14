import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'Site';
const schema = new Schema({
    id: String,
    lat: Number,
    long: Number,
    name: String,
    url: String,
    startTime: Number,
    endTime: Number,
    index: Number,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface IObsSiteModel extends Model<IObsSiteDocument>, IOgmsModel {}
export const ObsSiteModel: IObsSiteModel = model<IObsSiteDocument, IObsSiteModel>(collectionName, schema);

interface IObsSiteDocument extends Document {
    id: string;
    lat: number;
    long: number;
    name: string;
    url: string;
    startTime: number;
    endTime: number;
    index: number;
}