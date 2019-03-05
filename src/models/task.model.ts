/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { DataRefer, CmpObj, ISolutionDocument } from './solution.model';
import { ISchemaDocument } from './UDX-schema.model';
import { IUserDocument } from './user.model';
import * as _ from 'lodash';

const collectionName = 'CmpTask';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    auth: Schema.Types.Mixed,
    solutionId: String,
    // topicId: String,
    calcuTaskIds: Array,
    progress: Number,
    state: String,
    cmpObjs: Schema.Types.Mixed,
    cmpMethods: Array,
    refactored: Schema.Types.Mixed,
    isAllSTDCache: Boolean,
    temporal: Number,
    regions: Schema.Types.Mixed,
    sites: Array,
    cid: String,
    subscribed_uids: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ITaskModel extends Model<ITaskDocument>, IOgmsModel {}
export const TaskModel: ITaskModel = model<ITaskDocument, ITaskModel>(collectionName, schema);

(TaskModel as any).ogms_constructor = (user?: IUserDocument, sln?: ISolutionDocument) => {
    let task: any = {
        meta: {
            name: null,
            desc: null,
            time: new Date().getTime(),
        },
        calcuTaskIds: [],
        cmpObjs: _.cloneDeep(sln.cmpObjs),
        cmpMethods: [],
        refactored: [],
        subscribed_uids: [],
        regions: [],
        sites: [],
    }
    if(user) {
        task.auth = {
            userId: user._id,
            userName: user.username,
            src: ResourceSrc.PUBLIC
        };
    }
    else {
        task.auth = {
            userId: null,
            userName: null,
            src: null
        };
    }
    return task;
}

export interface ITaskDocument extends Document {
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
    state: OGMSState;
    progress: number;
    solutionId?: string;
    calcuTaskIds: string[];
    cmpObjs: Array<CmpObj>;
    cmpMethods: Array<{
        id: string,
        name: string,
    }>;
    refactored?: {
        metricName: string,
        fname: string,
        methods?: {
            // isAllSTDCache === true: 
            // imgFPath = `public/images/std-plots/`${index}-${lat}-${long}-${field}-${slnId}``
            id: string,
            name: string,
            progress?: number,
            state?: string,
            result?: {
                img?: string,
                ext?: string,
                imgPrefix?: string,
                timeLabels?: string,
                regionLength?: string,
                format?: string,
            },
        }[],
    }[];
    isAllSTDCache?: boolean;
    temporal: number;
    regions?: [][];
    sites?: {
        index: number,
        lat: number,
        long: number,
        coor?: string
    }[];
    cid: string;
    subscribed_uids: string[];
}

export enum OGMSState {
    INIT = 'INIT',
    COULD_START = 'COULD_START',
    RUNNING = 'RUNNING',
    FINISHED_SUCCEED = 'FINISHED_SUCCEED',
    FINISHED_FAILED = 'FINISHED_FAILED',
    PENDING = 'PENDING',
};