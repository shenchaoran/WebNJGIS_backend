/**
 * 计算任务
 * 这个表算是一个中间产物，其实存在cmp-task的calcuTasks中也行，但是多表查询很麻烦
 */
import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';
import * as _ from 'lodash';
import { Event } from './model-service.model';
import { OGMSState } from './task.model';

const collectionName = 'Calcu_Task';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    auth: Schema.Types.Mixed,
    cmpTaskId: String,
    cmpTaskName: String,
    IO: Schema.Types.Mixed,
    nodeId: String,
    msId: String,
    msName: String,
    topicId: String,
    topicName: String,
    log: Schema.Types.Mixed,
    state: String,
    progress: Number,
    cid: String,
    subscribed_uids: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ICalcuTaskModel extends Model<ICalcuTaskDocument>, IOgmsModel {}

export const CalcuTaskModel: ICalcuTaskModel = model<ICalcuTaskDocument, ICalcuTaskModel>(collectionName, schema);

export interface ICalcuTaskDocument extends Document {
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
    state: OGMSState;
    progress: number;
    subscribed_uids: string[];
    cid: string;
    [key: string]: any;
}