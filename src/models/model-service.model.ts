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
            stdId: String,
            stdClass: String,
            topic: String,
            path: String,
            exeName: String
        };
  
        super(collectionName, schema);
    }
}

export const modelServiceDB = new ModelServiceDB();

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
            topic: string
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
    stdId: string;
    stdClass: string;
    topic: string;
    path: string;
    exeName: string;
}

// 暂时不考虑 可选、多选一、级联
export class Event {
    id: string;
    name: string;
    description: string;
    schemaId: string;
    // 该字段用于 获取文件
    // upload: data id
    // std: index in std
    value?: string;
    // TODO
    isFile?: boolean;
    optional?: number;
    // 该字段用于 文件下载时的文件名 和 前台显示 label
    fname?: string;
    // 下载链接
    url?: string;
    ext: string;
}