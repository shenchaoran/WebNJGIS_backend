import { OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'Process_Queue';
const schema = new Schema({
    taskId: String,
    cmpObjId: String,
    methodId: String,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)

interface IProcessQueueModel extends Model<IProcessQueueDocument>, IOgmsModel {}
export const ProcessQueueModel: IProcessQueueModel = model<IProcessQueueDocument, IProcessQueueModel>(collectionName, schema);

export interface IProcessQueueDocument extends Document {
    taskId: string;
    cmpObjId: string;
    methodId: string;
    pid: number;
    condition: any;                     // 数据库的查询语句
    updatePath: any;                    // 数据库的更新语句
}