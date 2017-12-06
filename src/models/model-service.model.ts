import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class ModelServiceDB extends Mongoose {
    constructor() {
        const collectionName = 'Model_Service';
        const schema = {
            service: {
                host: String,
                port: String,
                APIs: {
                    intro: String,
                    start: String,
                    stop: String,
                    progress: String,
                    data: String
                }
            },
            MDL: {
                meta: {
                    name: String,
                    keywords: [String],
                    abstract: String
                },
                IO: [
                    {
                        name: String,
                        type: String,
                        description: String,
                        optional: Boolean,
                        schema$: {
                            type: Number,
                            externalId: String
                        }
                    }
                ],
                runtime: mongoose.Schema.Types.Mixed
            }
        };

        super(collectionName, schema);
    }
}

export const modelServiceDB = new ModelServiceDB();

export class ModelService {
    _id: mongoose.Schema.Types.ObjectId;
    service: {
        host: string,
        port: string,
        APIs: {
            intro: string,
            start: string,
            stop: string,
            progress: string,
            data: string
        }
    };
    MDL: {
        meta: {
            name: string,
            keywords: [string],
            abstract: string
        },
        IO: [
            {
                name: string,
                type: string,
                description: string,
                optional: boolean,
                schema$: {
                    type: number,
                    externalId: string
                }
            }
        ],
        runtime: any
    }
}