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
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[], public regions) {
        super(dataRefers, schemas)
        this.scriptPath = path.join(__dirname, '../../py-scripts/taylor-diagram.py')
        this.cmpMethodName = `contour-map`;
    }

    public async start() {
        let variables = [],
            ncPaths = [],
            markerLabels = [],
            bboxs = this.regions,
            outputName = new ObjectId().toHexString(),
            output = path.join(__dirname, '../../public/images', outputName);

        await Bluebird.map(this.dataRefers, async dataRefer => {
            let geoData = await GeoDataModel.findOne({ _id: dataRefer.value });
            let fpath = path.join(setting.geo_data.path, geoData.meta.path);
            variables.push(dataRefer.field)
            ncPaths.push(fpath)
            markerLabels.push(dataRefer.msName)
        });
        // const cp = child_process.spawn('python', [
        //     this.scriptPath,
        //     `--variables=${JSON.stringify(variables)}`,
        //     `--ncPaths=${JSON.stringify(ncPaths)}`,
        //     `--markerLabels=${JSON.stringify(markerLabels)}`,
        //     `--bboxs=${JSON.stringify(bboxs)}`,
        //     `--output=${output}`,
        // ])
        // let stdout = '',
        //     stderr = '';
        // cp.stdout.on('data', data => {
        //     stdout += data.toString();
        // });
        // cp.stderr.on('data', data => {
        //     stderr += data.toString();
        // })
        // cp.on('close', async code => {
        //     console.log(code)
        //     if(code === 0) {
        //         try {
        //             console.log(this.finishMessage)
        //         }
        //         catch(e) {
        //             console.error(e)
        //             this.emit('onCmpFailed')
        //         }
        //     }
        //     else {
        //         console.error(stderr);
        //         this.emit('onCmpFailed')
        //     }
        // })
    }

    public async afterCmp(taskId, cmpObjIndex, methodIndex) {
        try {
            // TODO
            await TaskModel.updateOne({ _id: taskId }, {
                $set: { [`cmpObjs.${cmpObjIndex}.methods.${methodIndex}.result`]: this.result }
            })
            return { code: 200 }
        }
        catch (e) {
            console.error(e);
            return { code: 500 }
        }
    }
}