import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class CmpMethodDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpMethod';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            md: String,
            IO: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const cmpMethodDB = new CmpMethodDB();

export class CmpMethod {
    _id?: any;
    meta: {
        name: string,
        desc: string,
        time: number
    };
    IO: {
        schemas: any[],
        inputs: any[],
        outputs: any[]
    };
    md: string;
}