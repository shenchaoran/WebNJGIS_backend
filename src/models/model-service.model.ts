import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { UDXSchema } from './UDX-schema.class';

class ModelServiceDB extends Mongoose {
    constructor() {
        const collectionName = 'Model_Service';
        const schema = {
            auth: {
                nodeName: String,
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
    _id?: any;
    auth: {
        nodeName: string,
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
        params: Param[],
        runtime: any;
    };
}

export class Param {
    name: string;
    optional: boolean;
    desc: string;
    defaultValue: string; //对应一个dataid 该数据对应区域的配置参数值
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
    type?: 'input' | 'output' | 'parameter';
    description?: string;
    optional?: boolean;
    schemaId?: string;
}
