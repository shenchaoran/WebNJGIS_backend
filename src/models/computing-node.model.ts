/**
 * 计算节点
 */

import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';

const collectionName = 'Computing_Node';
const schema = new Schema({
    host: String,
    port: String,
    API_prefix: String,
    auth: Schema.Types.Mixed
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface IComputingNodeModel extends Model<IComputingNodeDocument>, IOgmsModel {}
export const ComputingNodeModel: IComputingNodeModel = model<IComputingNodeDocument, IComputingNodeModel>(collectionName, schema);

export interface IComputingNodeDocument extends Document {
    host: string;
    port: string;
    API_prefix: string;
    auth: {
        nodeName: string,
        password: string,
        src: ResourceSrc
    }
}
