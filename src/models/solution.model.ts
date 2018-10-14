/**
 * 比较方案用来描述比较对象的schema和比较方法
 */

import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

import { ResourceSrc } from './resource.enum';
import { CmpResult } from './task.model';
import * as _ from 'lodash';

class SolutionDB extends Mongoose {
    constructor() {
        const collectionName = 'CmpSolution';
        const schema = {
            meta: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            issueId: String,
            taskIds: mongoose.Schema.Types.Mixed,
            participants: mongoose.Schema.Types.Mixed,
            cmpObjs: mongoose.Schema.Types.Mixed,
            cid: String
        };

        super(collectionName, schema);
    }
}

export const solutionDB = new SolutionDB();

export class Solution {
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
    issueId?: string;
    // taskIds?: string[];
    participants: string[];
    cmpObjs: Array<CmpObj>;
    cid: string;
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
    schemaId?: string;
    methods: {
        id: string,
        name: string,
        result: {   // table-chart: echart-opt
            progress: number,
            state: string,
        } | {       // table-statistic: 
            progress: number,
            state: string,
        } | {       // ascii-img: 
            progress: number,
            state: string,
            msId: string,
            eventId: string,
            img: any
        }[]
    }[];
}

export class DataRefer {
    msId: string;
    msName: string;
    eventId: string;
    eventName: string;
    schemaId: string;
    msrName?: string;
    msrId?: string;
    value?: string;
    field?: string;
    cmpResult?: CmpResult;
}