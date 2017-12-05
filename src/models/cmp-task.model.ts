import { MongooseModel } from './mongodb.model';
import * as mongoose from 'mongoose';

class CmpTaskModel extends MongooseModel {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const CmpTaskModelInstance = new CmpTaskModel();

export class CmpTask {
    
}