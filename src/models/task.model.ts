/**
 * 比较任务包括驱动模型运行的配置，和模型比较的配置
 * cmp task 和参与比较的model task相关联
 */

import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { DataRefer, CmpObj } from './solution.model';
import { UDXSchema } from './UDX-schema.class';

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
    schemas: Schema.Types.Mixed,
    cid: String,
    subscribed_uids: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ITaskModel extends Model<ITaskDocument>, IOgmsModel {}
export const TaskModel: ITaskModel = model<ITaskDocument, ITaskModel>(collectionName, schema);

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
    state: CmpState;
    progress: number;
    solutionId?: string;
    calcuTaskIds: string[];
    cmpObjs: Array<CmpObj>;
    schemas: UDXSchema[];
    cid: string;
    subscribed_uids: string[];
}

export enum CmpState {
    INIT = 'INIT',
    COULD_START = 'COULD_START',
    RUNNING = 'RUNNING',
    FINISHED_SUCCEED = 'FINISHED_SUCCEED',
    FINISHED_FAILED = 'FINISHED_FAILED'
};

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