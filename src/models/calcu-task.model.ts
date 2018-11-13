/**
 * 计算任务
 * 这个表算是一个中间产物，其实存在cmp-task的calcuTasks中也行，但是多表查询很麻烦
 */

import { Mongoose, OgmsObj } from './mongoose.base';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';
import * as _ from 'lodash';
import { Event } from './model-service.model';

class CalcuTaskDB extends Mongoose {
    constructor() {
        const collectionName = 'Calcu_Task';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            cmpTaskId: String,
            cmpTaskName: String,
            IO: mongoose.Schema.Types.Mixed,
            msId: String,
            msName: String,
            topicId: String,
            topicName: String,
            stdId: String,
            log: mongoose.Schema.Types.Mixed,
            state: String,
            progress: Number,
            cid: String,
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
    msId: string;
    msName: string;
    topicId: string;
    topicName: string;
    cmpTaskId: string;
    cmpTaskName: string;
    nodeId: string;    
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
    stdId: string;
    state: CalcuTaskState;
    progress: number;
    subscribed_uids: string[];
    cid: string;
    [key: string]: any;
}

export enum CalcuTaskState {
    INIT = 'INIT',
    COULD_START = 'COULD_START',
    START_PENDING = 'START_PENDING',
    START_FAILED = 'START_FAILED',
    RUNNING = 'RUNNING',
    FINISHED_FAILED = 'FINISHED_FAILED',
    FINISHED_SUCCEED = 'FINISHED_SUCCEED'
};