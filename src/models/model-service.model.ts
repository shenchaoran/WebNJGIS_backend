import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { UDXSchema } from './UDX-schema.class';

class ModelServiceDB extends Mongoose {
    constructor() {
        const collectionName = 'Model_Service';
        const schema = {
            auth: mongoose.Schema.Types.Mixed,
            MDL: mongoose.Schema.Types.Mixed,
            stdIds: mongoose.Schema.Types.Mixed,
            nodeIds: String,
            tag: String,
            topicId: String,
            topicName: String,
            exeName: String,
            subscribed_uids: Array,
        };
  
        super(collectionName, schema);
    }
}

export const modelServiceDB = new ModelServiceDB();

/**
 * 除了以下情况，数据库中的条目信息一般不会变：
 *      计算节点更改：更新 nodeIds
 *      标准数据集更改：更新 stdIds
 *
 * @export
 * @class ModelService
 */
export class ModelService {
    _id?: any;
    auth: {
        nodeId: string,
        nodeName: string,
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
            schemas: UDXSchema[],
            std?: Event[],
            inputs: Event[],
            parameters?: Event[],
            outputs: Event[]
        },
        runtime: any;
    };
    nodeIds: string;
    stdIds: string[];
    tag: string;
    topicId: string;
    topicName: string;
    exeName: string;
    subscribed_uids: string[];
}

export class Event {
    id: string;
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
}