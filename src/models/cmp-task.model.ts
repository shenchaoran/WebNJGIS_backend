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
            cmpObjs: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask extends OgmsObj {
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
    // 0 未启动
    // 1 启动
    // -1 比较失败
    // 100 比较成功
    // [2, 99] 进度条
    progress: number;
    solutionId: string;
    issueId: string;
    calcuTaskIds: {
        _id: string,
        progress: number
    }[];
    cmpObjs: CmpObj[];
}
