import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { ISchemaDocument } from './UDX-schema.model';

const collectionName = 'Model_Service';
const schema = new Schema({
    auth: Schema.Types.Mixed,
    MDL: Schema.Types.Mixed,
    // stdIds: Schema.Types.Mixed,
    nodeIds: [String],
    tag: String,
    topicId: String,
    topicName: String,
    exeName: String,
    subscribed_uids: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface IModelServiceModel extends Model<IModelServiceDocument>, IOgmsModel {}
export const ModelServiceModel: IModelServiceModel = model<IModelServiceDocument, IModelServiceModel>(collectionName, schema);


/**
 * 除了以下情况，数据库中的条目信息一般不会变：
 *      计算节点更改：更新 nodeIds
 *      标准数据集更改：更新 stdIds
 */
export interface IModelServiceDocument extends Document {
    auth: {
        src: ResourceSrc
    };
    MDL: {
        meta: {
            name: string,
            keywords: string[],
            abstract: string,
            desc?: string,
            wikiMD?: string,
            wikiHTML?: string,
        },
        IO: {
            std?: Event[],
            inputs: Event[],
            parameters?: Event[],
            outputs: Event[]
        },
        runtime: any;
    };
    nodeIds: string[];
    // stdIds: string[];
    tag: string;
    topicId: string;
    topicName: string;
    exeName: string;
    subscribed_uids: string[];
}

export class Event {
    id: string;
    stdName?: string;
    name: string;
    description: string;
    schemaId: string;
    // 该字段用于 获取文件
    // upload: data id
    // std: index in std
    value?: string;
    // 如果从计算服务器上下载过来了，就为 true
    cached?: boolean;
    // TODO 
    // isFile?: boolean;
    optional?: number;
    // 该字段用于 文件下载时的文件名 和 前台显示 label
    fname?: string;
    // 下载链接
    url?: string;
    ext: string;
    temporal?: 'annual'|'monthly'|'daily';
}