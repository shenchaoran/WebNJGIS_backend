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

class CmpTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            cmpCfg: mongoose.Schema.Types.Mixed,
            calcuCfg: mongoose.Schema.Types.Mixed,
            calcuTasks: mongoose.Schema.Types.Mixed,
            cmpState: Number
        };

        super(collectionName, schema);
    }
}

export const cmpTaskDB = new CmpTaskDB();

export class CmpTask {
    _id?: any;
    meta: {
        name: string,
        desc: string,
        time: number
    };
    auth: {
        src: ResourceSrc,
        userId: string
    };
    cmpCfg: {
        solutionId: string,
        cmpObjs?: Array<CmpObj>
        // TODO 相关比较的结果对象
    };
    // 计算配置，即输入数据
    calcuCfg: CalcuCfg;
    cmpState: CmpState;
    calcuTasks: Array<{
      calcuTaskId: string,
      state: CalcuTaskState
    }>;
}

export enum CmpState {
    INIT = 0,
    RUNNING,
    SUCCEED,
    FAILED
}

// TODO 纵向比较时，要多份数据，
export class CalcuCfg {
    dataSrc: 'std' | 'upload';
    // upload
    // 此处为输入数据的引用参考，和cmpObj中的不同，后者是比较对象中的数据引用，大多数是输出文件
    dataRefers?: Array<{
        msId: string;
        eventName: string;
        dataId: string;
    }>;
    // std  时空
    stdSrc?: {
        spatial?: {
            dimension?: 'point' | 'polygon' | 'multi-point',
            point?: any,
            polygon?: any,
            multiPoint?: any
        },
        temporal?: {
            start: number;
            end: number;
            scale: 'YEAR' | 'DAY';
        };
    };
}
