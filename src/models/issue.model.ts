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

class IssueDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpIssue';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            spatial: mongoose.Schema.Types.Mixed,
            temporal: mongoose.Schema.Types.Mixed,
            solutionIds: mongoose.Schema.Types.Mixed,
            cid: String
        };

        super(collectionName, schema);
    }
}

export const issueDB = new IssueDB();

export class Issue {
    _id?: any;
    meta: {
        name: string,
        desc: string,
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