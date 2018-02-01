/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';

import { GeoDataClass } from './UDX-data.model';
import { CalcuTaskState } from './calcu-task.model';
import { CmpObj } from './cmp-obj.class';
import { CmpState } from './cmp-state.enum';
import { CalcuCfg } from './calcu-cfg.class';
import { DataRefer } from './dataRefer.class';

class CmpTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            solutionId: String,
            parameters: mongoose.Schema.Types.Mixed,
            // cmpCfg: mongoose.Schema.Types.Mixed,
            // calcuCfg: mongoose.Schema.Types.Mixed,
            calcuTasks: mongoose.Schema.Types.Mixed,
            cmpState: Number
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask {
    _id?: any;
    // 任务描述
    meta: {
        name: string,
        desc: string,
        time: number
    };
    // 权限管理
    auth: {
        src: ResourceSrc,
        userId: string,
        userName: string
    };
    solutionId: string;
    // 配置参数，时空参数在Issue中有
    parameters: {
        msId: string,
        eventName: string,
        dataId: string
    }[];
    // 比较结果状态
    cmpState: CmpState;             // undefined/INIT, RUNNING, FINISHED
    // 计算实例
    calcuTasks: Array<{
      calcuTaskId: string,
      state: CalcuTaskState
    }>;
}
