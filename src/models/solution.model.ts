/**
 * 比较方案用来描述比较对象的schema和比较方法
 */

import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';
import { ResourceSrc } from './resource.enum';
import { OGMSState } from './task.model';
import * as _ from 'lodash';

const collectionName = 'CmpSolution';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    auth: Schema.Types.Mixed,
    topicIds: Array,
    msIds: Array,
    cmpObjs: Array,
    cmpMethods: Array,
    temporal: Number,
    cid: String,
    subscribed_uids: Array,
    observationIds: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ISolutionModel extends Model<ISolutionDocument>, IOgmsModel {}
export const SolutionModel: ISolutionModel = model<ISolutionDocument, ISolutionModel>(collectionName, schema);

export interface ISolutionDocument extends Document {
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
    topicIds?: string[];
    msIds?: string[];
    observationIds?: string[];
    cmpObjs: CmpObj[];
    cmpMethods: {
        id: string,
        name: string
    }[];
    temporal?: number,          // 1 8 30 365
    cid: string;
    subscribed_uids: string[];
    [key: string]: any;
}


/**
 * 比较对象：从某一类数据文件中抽取出某一部分参与比较，称为比较对象。和数据schema关联
 * comparison object:
 *      Table
 *          chart (column)
 *          statistic (columns)
 *      Ascii_grid
 *          visualization (cesium)
 *          // mixing（图层混合） （放在前台处理或许更好？）
 *
 *      Gif (Ascii grid with timestamp)
 *          visualization
 *
 *      Shp
 *          visualization
 *          插值 -> Ascii_grid
 *
 */
export class CmpObj {
    id: string;
    name: string;
    desc: string;
    // 此处的数据参考是比较对象的数据参考，可能是输入，但绝大多数都是输出
    // TODO 对于日期的处理，暂时理解为时间区域内只有一个输出
    dataRefers: Array<DataRefer>;
}

export class DataRefer {
    cachedPosition: 'STD' | 'DB';
    type: 'simulation' | 'observation';
    msId?: string;
    msName?: string;
    eventType?: 'inputs' | 'outputs';
    eventId?: string;
    eventName?: string;
    stdEventName?: string;              // 用于将多个模型的 event 对应起来
    schemaId?: string;
    msrName?: string;
    msrId?: string;
    value?: string;
    field?: string;
    lat?: number;
    long?: number;
    stdId?: string;
    stdName?: string;
    datasetId?: string;                 // 标准输入数据集 id
}

// {   // table-chart: echart-opt
//     progress: number,
//     state: string,
// } | {       // table-statistic: 
//     progress: number,
//     state: string,
// } | {       // ascii-img: 
//     progress: number,
//     state: string,
//     msId: string,
//     eventId: string,
//     img: any
// }[]