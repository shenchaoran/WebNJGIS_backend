/**
 * 比较问题：描述实际遇到的地理问题
 * 
 */

import * as mongoose from 'mongoose';
import {
    Mongoose,
    Conversation,
    CmpObj,
    ResourceSrc
} from '.';

class TopicDB extends Mongoose {
    constructor() {
        const collectionName = 'Topic';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            spatial: mongoose.Schema.Types.Mixed,
            temporal: mongoose.Schema.Types.Mixed,
            solutionIds: Array,
            cid: String
        };

        super(collectionName, schema);
    }
}

export const topicDB = new TopicDB();

export class Topic {
    _id?: any;
    meta: {
        name: string,
        descMD: string,
        descHTML: string,
        time: number
    };
    auth: {
        src: ResourceSrc,
        userId: string,
        userName: string
    };
    spatial: {
        dimension: 'point' | 'polygon' | 'multi-point',
        geojson: any
    };
    temporal: {
        start: number;
        end: number;
        scale: 'YEAR' | 'DAY';
    };
    solutionIds: string[];
    cid: string[];
}