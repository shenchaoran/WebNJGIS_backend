import { MongooseModel } from './mongodb.model';
import * as mongoose from 'mongoose';

class ModelServiceModel extends MongooseModel {
    constructor() {
        const collectionName = 'ModelService';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const ModelServiceModelInstance = new ModelServiceModel();

export class ModelService {
    
}