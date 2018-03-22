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
            data: Event[],
            std?: any[]
        },
        runtime: any;
    };
}

// 暂时不考虑 可选、多选一、级联
export class Event {
    id: string;
    type: 'input' | 'output' | 'parameter';
    description: string;
    schemaId: string;
}