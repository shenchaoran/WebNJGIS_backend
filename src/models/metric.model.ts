import { OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'Metric';
const schema = new Schema({
    name: String,
    long_name: String,
    unit: String,
    description: String,
    category: String,
    scale: Number,
    offset: Number,
    min: Number,
    max: Number,
    couldCMP: Boolean,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)

interface IMetricModel extends Model<IMetricDocument>, IOgmsModel {}
export const MetricModel: IMetricModel = model<IMetricDocument, IMetricModel>(collectionName, schema);


export interface IMetricDocument extends Document {
    name: string;               // 代码里的缩写
    long_name: string;          // 界面上显示的名称
    unit: string;               // 单位
    description: string;        // 物理含义
    category: string | 'Carbon emission';           // 领域
    // scale?: number;             // 缩放因子，默认为1，应该放在 event 里
    // offset?: number;            // 偏移量，默认为0，同放在 event 里
    min: number;                // 最小合理值，默认 null
    max: number;                // 最大合理值，默认 null
    couldCMP: boolean;          // 是否参与对比，默认 false
}