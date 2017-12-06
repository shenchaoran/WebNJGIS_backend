import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class CmpTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask {
    
}