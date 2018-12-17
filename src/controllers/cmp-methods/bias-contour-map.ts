import { DataRefer, GeoDataModel, UDXSchema, CmpState, TaskModel } from '../../models';
import { ObjectID, ObjectId } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
import * as child_process from 'child_process';
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';

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
    scriptPath
    constructor(
        public dataRefers: DataRefer[], 
        public schemas: UDXSchema[], 
        public regions,
        public taskId, 
        public cmpObjIndex, 
        public methodIndex,
    ) {
        super(dataRefers, schemas, regions, taskId, cmpObjIndex, methodIndex)
        this.scriptPath = path.join(__dirname, '../../py-scripts/bias-contour-map.py')
        this.cmpMethodName = `bias-contour-map`;
    }

    public async start() {
        let variables = [],
            ncPaths = [],
            markerLabels = [],
            outputName = new ObjectId().toHexString(),
            output = path.join(__dirname, '../../public/images', outputName);

        await Bluebird.map(this.dataRefers, async dataRefer => {
            let geoData = await GeoDataModel.findOne({ _id: dataRefer.value });
            let fpath = path.join(setting.geo_data.path, geoData.meta.path);
            variables.push(dataRefer.field)
            ncPaths.push(fpath)
            markerLabels.push(dataRefer.msName)
        });

        let interpretor = 'python',
            argv = [
                this.scriptPath,
                `--variables=${JSON.stringify(variables)}`,
                `--ncPaths=${JSON.stringify(ncPaths)}`,
                `--markerLabels=${JSON.stringify(markerLabels)}`,
                `--output=${output}`,
            ],
            onSucceed = async stdout => {
                this.result = { 
                    state: CmpState.FINISHED_SUCCEED,
                    imgPrefix: outputName,
                    ext: '[".gif"]',
                }
            };
        return super._start(interpretor, argv, onSucceed)
        
    }
}