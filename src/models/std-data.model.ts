import { Mongoose, OgmsObj } from './mongoose.base';
import { UDXSchema } from './UDX-schema.class';
import { UDXCfg } from './UDX-cfg.class';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';

class STDDataDB extends Mongoose {
    constructor() {
        const collectionName = 'STD_Data';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            type: String,
            getter: String,
            models: mongoose.Schema.Types.Mixed,
            content: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const stdDataDB = new STDDataDB();

class STDData {
    _id: any;
    meta: {
        desc: string,
        name: string
    };
    type: 'input' | 'output';
    getter: string;
    models: string[];
    content: {
        rootPath: string,
        [key: string]: any
    };
}