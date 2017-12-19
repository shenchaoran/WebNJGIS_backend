/**
 * 比较方案只是比较对象的集合
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

import { CmpObj } from './cmp-obj.class';
import { ResourceSrc } from './resource.enum';

class CmpSolutionDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpSolution';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            cfg: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const cmpSolutionDB = new CmpSolutionDB();

export class CmpSolution {
    _id?: any;
    meta: {
        name: string,
        desc: string,
        time: string
    };
    cfg: {
        ms: Array<{
            msId: string,
            nodeName: string
        }>,
        cmpObjs: Array<CmpObj>,
        keynote: {
            direction: 'x'|'y',
            dimension: 'point' | 'polygon' | 'multi-point'
        }
    };
    auth: {
        userId: string,
        src: ResourceSrc
    };
}