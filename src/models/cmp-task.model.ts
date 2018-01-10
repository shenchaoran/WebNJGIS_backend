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
    // 任务描述
    meta: {
        name: string,
        desc: string,
        time: number
    };
    // 权限管理
    auth: {
        src: ResourceSrc,
        userId: string
    };
    // 比较配置
    cmpCfg: {
        solutionId: string,
        // ms数组用于分发计算任务
        ms: Array<{
            msId: string,
            msName: string,
            nodeName: string,
            participate: boolean       // deprecated 目前所有的都是 true
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
                dataId?: string,
                // data 存放具体比较的配置，如chart的列名，图像处理
                data: any,
                cmpResult?: {
                    state: CmpState,                // undefined/INIT, RUNNING, SUCCEED, FAILED
                    image?: [{
                      extent: any,
                      path: string,
                      title: string,
                      state: CmpState                // SUCCEED, FAILED
                    }],
                    chart?: {
                        state: CmpState
                    },
                    GIF?: {
                        state: CmpState
                    },
                    statistic?: {
                        state: CmpState
                    },
                },
                attached: {
                    src: ''
                }
            }>,
            attached: any
        }>
    };
    // 计算配置，即输入数据
    calcuCfg: CalcuCfg;
    // 比较结果状态
    cmpState: CmpState;
    // 计算实例
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
    // TODO 目前认为只能二选一，其实是可以混合计算的
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
