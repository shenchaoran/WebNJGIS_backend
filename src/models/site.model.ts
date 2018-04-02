import { Mongoose, OgmsObj } from './mongoose.base';
import * as mongoose from 'mongoose';

class SiteDB extends Mongoose {
    constructor() {
        const collectionName = 'Site';
        const schema = {
            x: Number,
            y: Number,
            index: Number
        };

        super(collectionName, schema);
    }
}

export const siteDB = new SiteDB();

class Site {
    _id: any;
    x: number;
    y: number;
    index: number;
}