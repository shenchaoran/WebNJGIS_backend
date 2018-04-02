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
            schemaName: String,
            models: mongoose.Schema.Types.Mixed,
            tags: mongoose.Schema.Types.Mixed,
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
    schemaName: string;
    tags: string[];
    models: string[];
    content: any;
}