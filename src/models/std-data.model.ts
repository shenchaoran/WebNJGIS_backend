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
            getter: String,
            models: mongoose.Schema.Types.Mixed,
            inputPath: String,
            outputPath: String,
            stdClass: String,
            content: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }

}

export const stdDataDB = new STDDataDB();

class STDData {
    _id: any;
    meta: {
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
        name: string
    };
    models: string[];
    inputPath: string;
    outputPath: string;
    stdClass: string;
    content: {
        [key: string]: any
    };
}