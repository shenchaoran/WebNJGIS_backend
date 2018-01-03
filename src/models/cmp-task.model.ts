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
        // ms数组用于分发计算任务，所以直接上传数据参与比较的模型就不用存在这里了
        ms: Array<{
            msId: string,
            msName: string,
            nodeName: string,
            participate: boolean
        }>,
        // 这里暂时先把sln的所有字段复制过来了，避免了多表查询
        keynote: {
            direction: 'x'|'y',
            dimension: 'point' | 'polygon' | 'multi-point'
        },
        cmpObjs: Array<{
            id: string,
            meta: {
                name: string,
                desc: string
            },
            schemaName: string,
            methods: string[],
            dataRefers: Array<{
                // 独立上传的，不是模型算出来的数据
                independent?: boolean,
                msId?: string,
                msName?: string,
                eventName?: string,
                dataId: string,
                // data 存放具体比较的配置，如chart的列名，图像处理
                data: any,
                cmpResult: {
                    state: CmpResultState,
                    image?: [{
                      extent: any,
                      path: string,
                      title: string,
                      state: CmpResultState
                    }],
                    chart?: {
                        state: CmpResultState
                    },
                    GIF?: {
                        state: CmpResultState
                    },
                    statistic?: {
                        state: CmpResultState
                    },
                }
            }>,
            attached: any
        }>
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

export enum CmpResultState {
    RUNNING = 0,
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
