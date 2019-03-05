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
import { IUserDocument } from './user.model';
import { ObjectID } from 'mongodb';

const collectionName = 'Calcu_Task';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    auth: Schema.Types.Mixed,
    cmpTaskId: String,
    solutionId: String,
    cmpTaskName: String,
    IO: Schema.Types.Mixed,
    nodeId: String,
    msId: String,
    msName: String,
    topicId: String,
    topicName: String,
    log: Schema.Types.Mixed,
    cachedPosition: String,
    state: String,
    progress: Number,
    cid: String,
    subscribed_uids: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ICalcuTaskModel extends Model<ICalcuTaskDocument>, IOgmsModel {}

export const CalcuTaskModel: ICalcuTaskModel = model<ICalcuTaskDocument, ICalcuTaskModel>(collectionName, schema);

(CalcuTaskModel as any).ogms_constructor = (user?: IUserDocument, ms?) => {
    let doc: any = {}
    doc._id = new ObjectID().toString();
    if (ms) {
        doc.msId = ms._id;
        doc.msName = ms.MDL.meta.name;
        doc.topicId = ms.topicId;
        doc.topicName = ms.topicName;
        doc.IO = _.cloneDeep(ms.MDL.IO);
        doc.IO.dataSrc = 'STD';
        // TODO 选择节点
        doc.nodeId = ms.nodeIds[0];
    }
    else {
        doc.IO = {}
    }
    
    doc.meta = {
        name: undefined,
        desc: undefined,
        time: new Date().getTime()
    };
    doc.subscribed_uids = [];
    doc.state = OGMSState.INIT;
    if(user) {
        doc.auth = {
            userId: user._id,
            userName: user.username,
            src: ResourceSrc.PUBLIC
        };
    }
    else {
        doc.auth = {
            userId: undefined,
            userName: undefined,
            src: undefined
        };
    }
    return doc;
}

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
        inputs: Event[],
        parameters: Event[],
        outputs: Event[],
        std: Event[]
    };
    log: {
        cached: boolean,
        dataId: string
    };
    cachedPosition: 'STD' | 'DB';
    state: OGMSState;
    progress: number;
    subscribed_uids: string[];
    cid: string;
    [key: string]: any;
}