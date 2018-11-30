import { DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));

/**
 * 前端 echarts 可视化
 * return {                 // 4 个热力图
 *      bias: HeatMapData,
 *      std: HeatMapData,
 *      correlation: HeatMapData,
 *      RMSE: HeatMapData,
 * }
 *
 * @export
 * @class SubHeatMap
 * @extends {CmpMethod}
 */
export default class SubHeatMap extends CmpMethod {
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super(dataRefers, schemas)
    }

    public async start() {

    }
}


class HeatMapData {
    variableName: string;       // 要素名
    regions: {                  // 矩阵的行名
        name: string;
        bbox: number[];         // 子区域坐标
    }[];
    models: {                   // 矩阵的列名
        msName: string;
        msId: string;
    }[];
    matrix: [][];               // 二维矩阵，保存统计指标：算出所有子区域的值后归一化到 [0, 1]
}