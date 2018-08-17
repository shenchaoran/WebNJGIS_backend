/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import { Mongoose, OgmsObj } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';

import { GeoDataClass } from './UDX-data.model';
import { CalcuTaskState } from './calcu-task.model';
import { CmpObj } from './cmp-obj.class';
import { CmpState } from './cmp-state.enum';
import { DataRefer } from './dataRefer.class';
import { CmpResult } from './cmp-result.class';

class CmpTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            solutionId: String,
            issueId: String,
            calcuTaskIds: mongoose.Schema.Types.Mixed,
            progress: Number,
            state: String
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask extends OgmsObj {
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
    state: string;
    progress: number;
    solutionId?: string;
    issueId?: string;
    calcuTaskIds: {
        _id: string,
        progress: number
    }[];
}
