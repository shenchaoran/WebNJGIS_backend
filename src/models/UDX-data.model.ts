import { MongooseModel } from './mongodb.model';

class DataModel extends MongooseModel {
    constructor() {
        const collectionName = 'Geo_Data';
        const schema = {
            gdid: String,
            filename: String,
            path: String
            // type: Number,
            // tag: String
        };

        super(collectionName, schema);
    }
}

export const DataModelInstance = new DataModel();

// deprecated
// export enum GeoDataType {
//     RAW = 1,
//     UDX = 2
// }

export class GeoDataClass {
    gdid: string;
    filename: string;
    path: string;
    // type: GeoDataType;
    // tag: string;
    constructor(filename, path) {
        this.filename = filename;
        this.path = path;
        // this.type = type;
        // this.tag = tag;
    }
}