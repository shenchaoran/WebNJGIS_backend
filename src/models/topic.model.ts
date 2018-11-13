/**
 * 比较问题：描述实际遇到的地理问题
 * 
 */
 
import { ResourceSrc } from './resource.enum';
import * as mongoose from 'mongoose';
import { Mongoose } from './mongoose.base';
import { Conversation } from './conversation.model';
import { CmpObj } from './solution.model';

class TopicDB extends Mongoose {
    constructor() {
        const collectionName = 'Topic';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            spatial: mongoose.Schema.Types.Mixed,
            temporal: mongoose.Schema.Types.Mixed,
            cid: String,
            subscribed_uids: Array,
        };

        super(collectionName, schema);
    }
}

export const topicDB = new TopicDB();

export class Topic {
    _id?: any;
    meta: {
        name: string,
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
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
    cid: string;
    subscribed_uids: string[];
}