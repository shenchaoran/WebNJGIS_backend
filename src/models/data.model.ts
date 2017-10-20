import { MongooseModel } from './mongodb.model';

class DataModel extends MongooseModel {
    constructor() {
        const collectionName = 'Geo_Data';
        const schema = {
            filename: String,
            path: String,
            type: Number,
            tag: String
        };

        super(collectionName, schema);
    }
}

export const dataModel = new DataModel();

export enum GeoDataType {
    RAW = 1,
    UDX = 2
}

export class GeoData {
    gdid: string;
    filename: string;
    path: string;
    type: GeoDataType;
    tag: string;
    constructor(filename, path, type, tag) {
        this.filename = filename;
        this.path = path;
        this.type = type;
        this.tag = tag;
    }
}