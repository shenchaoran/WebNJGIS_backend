/**
 * 比较问题：描述实际遇到的地理问题
 * 
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

import { CmpObj } from './cmp-obj.class';
import { ResourceSrc } from './resource.enum';

class CmpIssueDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpIssue';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            spatial: mongoose.Schema.Types.Mixed,
            temporal: mongoose.Schema.Types.Mixed,
            solutionIds: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const cmpIssueDB = new CmpIssueDB();

export class CmpIssue {
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
    solutionIds: string[]
}