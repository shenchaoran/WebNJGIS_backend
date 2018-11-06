/**
 * 计算任务
 * 这个表算是一个中间产物，其实存在cmp-task的calcuTasks中也行，但是多表查询很麻烦
 */

import { Mongoose, OgmsObj } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import * as _ from 'lodash';
import { Event } from './model-service.model';
import { Enum } from 'typescript-string-enums/dist';

class CalcuTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'Calcu_Task';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            cmpTaskId: String,
            IO: mongoose.Schema.Types.Mixed,
            // ms: mongoose.Schema.Types.Mixed,
            msId: String,
            // std: mongoose.Schema.Types.Mixed,
            stdId: String,
            log: mongoose.Schema.Types.Mixed,
            state: String,
            progress: Number,
            subscribed_uids: Array,
        };

        super(collectionName, schema);
    }
}

export const calcuTaskDB = new CalcuTaskDB();

export class CalcuTask extends OgmsObj {
    _id?: any;
    meta: {
        name: string,
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
        time: number
    };
    auth: {
        userId: string,
        userName: string,
        src: ResourceSrc
    };
    // ms: string;
    msId: string;
    cmpTaskId: string;
    IO: {
        dataSrc: 'STD' | 'UPLOAD',
        schemas: any[],
        inputs: Event[],
        parameters: Event[],
        outputs: Event[],
        std: Event[]
    };
    log: {
        cached: boolean,
        dataId: string
    };
    // std: any;
    stdId: string;
    // 表示状态
    state: CalcuTaskState;
    // 只表示进度条
    progress: number;
    subscribed_uids: string[];
}

export const CalcuTaskState = Enum(
    'INIT',
    'COULD_START',
    'START_PENDING',
    'START_FAILED',
    'RUNNING',
    'FINISHED_FAILED',
    'FINISHED_SUCCEED'
);
export type CalcuTaskState = Enum<typeof CalcuTaskState>;
