import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'Site';
const schema = new Schema({
    id: String,
    lat: Number,
    long: Number,
    elevation: Number,
    PFT: String,
    tier1: String,
    tier2: String,
    name: String,
    url: String,
    startTime: Number,
    endTime: Number,
    index: Number,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface IObsSiteModel extends Model<IObsSiteDocument>, IOgmsModel {}
export const ObsSiteModel: IObsSiteModel = model<IObsSiteDocument, IObsSiteModel>(collectionName, schema);

export interface IObsSiteDocument extends Document {
    id: string;
    lat: number;
    long: number;
    name: string;
    url: string;
    startTime: number;      // Tier 2 
    endTime: number;        // Tier 2
    elevation: number;
    PFT: string;
    tier1: string;
    tier2: string;
    index: number;
}