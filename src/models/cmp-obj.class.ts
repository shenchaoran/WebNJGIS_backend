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
    dataRefers: Array<{
        // 独立上传的，不是模型算出来的数据
        independent?: boolean,
        msId?: string,
        msName?: string,
        eventName?: string,
        dataId?: string,
        // data 存放具体比较的配置，如chart的列名，图像处理
        data: any
    }>;
    cmpResults?: Array<CmpResult>;
    schemaTypes: string[];
    methods: any[];
}

/**
 * 这里将多个比较方法的结果都放在一起了
 */
export class CmpResult {
    dataId?: string;
    state: CmpResultState;
    image?: {
      extent: any,
      path: string,
      title: string
    };
    chart?: {

    };
    GIF?: {

    };
    statistic?: {

    };
}

export enum CmpResultState {
  PENDING,
  SUCCEED,
  FAILED
}
