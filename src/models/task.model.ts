/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import { Mongoose, OgmsObj } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { Enum } from 'typescript-string-enums/dist';
import { DataRefer, CmpObj } from '.';
import { UDXSchema } from './UDX-schema.class';

class TaskDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpTask';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            solutionId: String,
            topicId: String,
            calcuTaskIds: mongoose.Schema.Types.Mixed,
            progress: Number,
            state: String,
            cmpObjs: mongoose.Schema.Types.Mixed,
            schemas: mongoose.Schema.Types.Mixed,
            cid: String,
            subscribed_uids: Array,
        };

        super(collectionName, schema);
    }
}

export const taskDB = new TaskDB();

export class Task extends OgmsObj {
    _id?: any;
    meta: {
        name: string,
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
        time: number
    };
    auth: {
        src: ResourceSrc,
        userId: string,
        userName: string
    };
    state: CmpState;
    progress: number;
    solutionId?: string;
    topicId?: string;
    calcuTaskIds: {
        _id: string,
        progress: number
    }[];
    cmpObjs: Array<CmpObj>;
    schemas: UDXSchema[];
    cid: string;
    subscribed_uids: string[];
}

export const CmpState = Enum(
    'INIT',                     // 仅做保存状态
    'COULD_START',              // 可以启动状态
    'RUNNING',
    'FINISHED_SUCCEED',
    'FINISHED_FAILED'
)
export type CmpState = Enum<typeof CmpState>

export class CmpResult {
    image?: [{
      extent: any,
      path: string,                 // data/:id/:entry 此处返回一个图片的文件路径，不要把base64塞进去，不然太大
      title: string,
      progress: number
    }];
    chart?: {
        show: any,
        prop: any
        // progress: number,
        // path: string,               // data/:id/:entrance 同样的，这里也放一个文件路径，前台解析为二位数组，做成 chart
        // row: any[]
    };
    GIF?: {
        progress: number
    };
    statistic?: {
        progress: number,
        path: string
    };
}