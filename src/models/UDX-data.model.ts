import { MongooseModel } from './mongodb.model';
import { UDXSchema } from './UDX-schema.class';
import * as mongoose from 'mongoose';


class DataModel extends MongooseModel {
    constructor() {
        const collectionName = 'Geo_Data';
        const schema = {
            gdid: String,
            filename: String,
            path: String,
            $schema: mongoose.SchemaTypes.Mixed,
            permission: String,
            userId: String
        };

        super(collectionName, schema);
    }
}

export const DataModelInstance = new DataModel();

export class GeoDataClass {
    _id: mongoose.Types.ObjectId;
    gdid: string;
    filename: string;
    path: string;
    $schema: UDXSchema;
    permission: string;
    userId: string;
}