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
            stdInputId: String,
            stdOutputId: String,
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
    stdInputId: string;
    stdOutputId: string;
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
    // 使用 std data 计算时，value为 std data id
    value?: string;
    optional?: number;
    fname?: string;
    ext: string;
}