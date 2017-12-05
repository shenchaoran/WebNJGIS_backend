import { MongooseModel } from './mongodb.model';
import * as mongoose from 'mongoose';

class CmpSceneModel extends MongooseModel {
    constructor() {
        const collectionName = 'CmpScene';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const CmpSceneModelInstance = new CmpSceneModel();

export class CmpScene {
    
}