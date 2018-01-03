/**
 * 比较方案用来描述比较对象的schema和比较方法
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
            cmpCfg: mongoose.Schema.Types.Mixed,
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
        time: number
    };
    cmpCfg: {
        cmpObjs: Array<{
            id: string,
            meta: {
                name: string,
                desc: string
            },
            schemaName: string,
            methods: string[]
        }>,
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