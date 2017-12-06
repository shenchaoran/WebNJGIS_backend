import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class CmpSceneDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpScene';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const cmpSceneDB = new CmpSceneDB();

export class CmpScene {
    
}