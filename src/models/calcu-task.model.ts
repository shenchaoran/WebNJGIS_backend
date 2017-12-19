/**
 * 计算任务
 * 这个表算是一个中间产物，其实存在cmp-task的calcuTasks中也行，但是多表查询很麻烦
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { CalcuCfg } from './cmp-task.model';

class CalcuTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'Calcu_Task';
        const schema = {
            msId: String,
            nodeName: String,
            calcuCfg: mongoose.Schema.Types.Mixed,
            state: Number
        };

        super(collectionName, schema);
    }
}

export const calcuTaskDB = new CalcuTaskDB();

export class CalcuTask {
    _id?: any;
    msId: string;
    nodeName: string;
    calcuCfg: CalcuCfg;
    output: Array<{
        msId: string;
        eventName: string;
        dataId: string;
    }>;
    state: CalcuTaskState;
}

export enum CalcuTaskState {
    INIT = 0,
    PAUSE,
    START_PENDING,
    START_FAILED,
    RUNNING,
    RUN_FAILED,
    RUN_SUCCEED
}
