import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { UDXSchema } from './UDX-schema.class';

class ModelServiceDB extends Mongoose {
    constructor() {
        const collectionName = 'Model_Service';
        const schema = {
            service: {
                host: String,
                port: String,
                APIs: {
                    intro: String,
                    start: String,
                    stop: String,
                    progress: String,
                    data: String
                },
                src: Number
            },
            MDL: {
                meta: {
                    name: String,
                    keywords: [String],
                    abstract: String
                },
                IO: {
                    schemas: mongoose.Schema.Types.Mixed,
                    data: mongoose.Schema.Types.Mixed
                },
                runtime: mongoose.Schema.Types.Mixed
            }
        };

        super(collectionName, schema);
    }
}

export const modelServiceDB = new ModelServiceDB();

export class ModelService {
    _id?: mongoose.Schema.Types.ObjectId;
    service: {
        host: string,
        port: string,
        APIs: {
            intro: string,
            start: string,
            stop: string,
            progress: string,
            data: string
        },
        src: ResourceSrc
    };
    MDL: {
        meta: {
            name: string,
            keywords: string[],
            abstract: string
        },
        IO: {
            schemas: UDXSchema[],
            data: Event[]
        },
        runtime: any;
    };
}

// 可以还原出一棵树，可以表现父子关系、多选一关系
// 表示可选关系时，
export class Event {
    // 当前event name
    id: string;
    // 级联关系
    parentId?: string;
    childrenId?: Array<string>;
    // 多选一关系
    options?: Array<string>;
    optionType?: 'value' | 'file';
    // 输入还是输出
    type?: 'input' | 'output';
    description?: string;
    optional?: boolean;
    schemaId?: string;
}
