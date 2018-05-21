/**
 * 计算任务
 * 这个表算是一个中间产物，其实存在cmp-task的calcuTasks中也行，但是多表查询很麻烦
 */

import { Mongoose, OgmsObj } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { ObjectID } from 'mongodb';
import * as _ from 'lodash';
import { Event } from './model-service.model';

class CalcuTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'Calcu_Task';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            msId: String,
            msName: String,
            topic: String,
            topicId: String,
            cmpTaskId: String,
            nodeName: String,
            IO: mongoose.Schema.Types.Mixed,
            stdId: String,
            stdClass: String,
            state: Number,
            progress: Number
        };

        super(collectionName, schema);
    }
}

export const calcuTaskDB = new CalcuTaskDB();

export class CalcuTask extends OgmsObj {
    _id?: any;
    meta: {
        name: string,
        desc: string,
        time: number
    };
    auth: {
        userId: string,
        userName: string,
        src: ResourceSrc
    };
    msId: string;
    msName: string;
    topic?: string;
    topicId?: string;
    cmpTaskId: string;
    nodeName: string;
    IO: {
        dataSrc: 'STD' | 'UPLOAD',
        schemas: any[],
        inputs: Event[],
        parameters: Event[],
        outputs: Event[],
        std: Event[]
    };
    stdId: string;
    stdClass: string;
    state: CalcuTaskState;
    // 0 未启动
    // 1 启动
    // -1 失败
    // 100 成功
    // [2, 99] 进度条
    progress: number;
}

export enum CalcuTaskState {
    INIT = 0,
    COULD_START,
    START_PENDING,
    START_FAILED,
    RUNNING,
    FINISHED_FAILED,
    FINISHED_SUCCEED
}
