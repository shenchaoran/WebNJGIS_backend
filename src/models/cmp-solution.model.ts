/**
 * 比较方案用来描述比较对象的schema和比较方法
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

import { CmpObj } from './cmp-obj.class';
import { ResourceSrc } from './resource.enum';
import { DataRefer } from './dataRefer.class';

class CmpSolutionDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpSolution';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            issueId: String,
            taskIds: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const cmpSolutionDB = new CmpSolutionDB();

export class CmpSolution {
    _id?: any;
    // 方案描述
    meta: {
        name: string,
        desc: string,
        time: number
    };
    // 权限管理
    auth: {
        userId: string,
        userName: string,
        src: ResourceSrc
    };
    issueId: string;
    taskIds: string[];
    // 比较配置
    cmpCfg: {
        ms: Array<{
            msId: string,
            msName: string,
            participate: boolean
        }>,
        // 比较基调
        keynote: {
            direction: 'multi'|'single',
            dimension: 'point' | 'polygon' | 'multi-point'
        },
        // 比较对象
        cmpObjs: Array<{
            id: string,
            // 比较对象描述
            meta: {
                name: string,
                desc: string
            },
            // 比较对象配置
            name: string,
            methods: string[],
            dataRefers: DataRefer[],
            attached: any
        }>
    };
}