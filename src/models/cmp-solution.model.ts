import { MongooseModel } from './mongodb.model';
import * as mongoose from 'mongoose';

class CmpSolutionModel extends MongooseModel {
    constructor() {
        const collectionName = 'CmpSolution';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const CmpSolutionModelInstance = new CmpSolutionModel();

export class CmpSolution {
    
}