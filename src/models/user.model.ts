import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'User';
const schema = new Schema({
    username: String,
    password: String,
    email: String,
    avator: String,
    url: String,
    group: String,
    location: String
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface IUserModel extends Model<IUserDocument>, IOgmsModel {}
export const UserModel: IUserModel = model<IUserDocument, IUserModel>(collectionName, schema);

export interface IUserDocument extends Document {
    username: string;
    password: string;
    email?: string;
    avator: string;
    url?: string;
    group?: string;
    location?: string;
}