import { DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));

/**
 * 前端 geoserver 可视化，后台将结果计算并保存起来
 *
 * @export
 * @class SubContourMap
 * @extends {CmpMethod}
 */
export default class SubContourMap extends CmpMethod {
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super(dataRefers, schemas)
    }

    public async start() {
        
    }
}