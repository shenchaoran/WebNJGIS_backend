import { DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));

/**
 * 计算偏差等值线图，将结果发布为 geoserver wms
 *      1. 调用 python 脚本，计算出 bias.nc
 *      2. 自动化发布 geoserver 服务，包括样式服务、数据服务、图层服务
 *
 * @export
 * @class ContourMap
 * @extends {CmpMethod}
 */
export default class ContourMap extends CmpMethod {
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super(dataRefers, schemas)
    }

    public async start() {
        
    }
}