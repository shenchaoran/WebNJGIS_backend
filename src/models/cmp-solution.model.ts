import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class CmpSolutionDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpSolution';
        const schema = {
            
        };

        super(collectionName, schema);
    }
}

export const cmpSolutionDB = new CmpSolutionDB();

export class CmpSolution {
    
}