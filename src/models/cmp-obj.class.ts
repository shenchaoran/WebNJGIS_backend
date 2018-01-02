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
import * as _ from 'lodash';

import { GeoDataClass } from './UDX-data.model';
import { UDXSchema } from '../models/UDX-schema.class';
import { ObjectID } from 'mongodb';
import { SchemaName } from './UDX-schema.class';

export class CmpObj {
    id: string;
    meta: {
        name: string,
        desc: string
    };
    // 此处的数据参考是比较对象的数据参考，可能是输入，但绝大多数都是输出
    // TODO 对于日期的处理，暂时理解为时间区域内只有一个输出
    dataRefers: Array<{
        // 独立上传的，不是模型算出来的数据
        independent?: boolean,// 暂时还没用到这个字段，默认认为ms的participate为false时是独立上传的
        msId?: string,
        msName?: string,
        eventName?: string,
        dataId: string,
        // data 存放具体比较的配置，如chart的列名，图像处理
        data: any
    }>;
    cmpResults?: Array<CmpResult>;
    schemaTypes: string[];
    methods: any[];
}

/**
 * 这里将多个比较方法的结果都放在一起了
 * 每一个比较方法里都有state
 */
export class CmpResult {
    dataId?: string;
    state: CmpResultState;
    image?: [{
      extent: any,
      path: string,
      title: string,
      state: CmpResultState
    }];
    chart?: {
        state: CmpResultState
    };
    GIF?: {
        state: CmpResultState
    };
    statistic?: {
        state: CmpResultState
    };
}

export enum CmpResultState {
  RUNNING,
  SUCCEED,
  FAILED
}
