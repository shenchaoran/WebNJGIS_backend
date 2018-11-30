import { DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
import SubHeatMap from './sub-region-heat-map'
const fs = Bluebird.promisifyAll(require('fs'));

/**
 * 前端 echarts 可视化
 * 和 sub-region-heat-map 的数据处理方法相同，只不过前者处理的是 bias, std, coefficient, RMSE，这里处理的是 variable
 * 在 前者处理时一并处理了，买一送一
 *
 * @export
 * @class SubLineChart
 * @extends { CmpMethod }
 */
export default class SubLineChart extends SubHeatMap {
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super(dataRefers, schemas)
    }
}