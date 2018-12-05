import { TaskModel, DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID, ObjectId } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
import * as child_process from 'child_process';
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';

export default class TaylorDiagram extends CmpMethod {
    scriptPath
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[]) {
        super(dataRefers, schemas)
        this.scriptPath = path.join(__dirname, '../../py-scripts/taylor-diagram.py')
        this.cmpMethodName = `taylor-diagram`;
    }

    public async start() {
        let variables = [],
            ncPaths = [],
            markerLabels = [],
            outputName = new ObjectId().toHexString() + '.png',
            output = path.join(setting.geo_data.path, outputName);
        await Bluebird.map(this.dataRefers, async dataRefer => {
            let geoData = await GeoDataModel.findOne({ _id: dataRefer.value });
            let fpath = path.join(setting.geo_data.path, geoData.meta.path);
            variables.push(dataRefer.field)
            ncPaths.push(fpath)
            markerLabels.push(dataRefer.msName)
        });
        const cp = child_process.spawn('python', [
            this.scriptPath,
            `--variables=${JSON.stringify(variables)}`,
            `--ncPaths=${JSON.stringify(ncPaths)}`,
            `--markerLabels=${JSON.stringify(markerLabels)}`,
            `--output=${output}`,
        ])
        let stdout = '',
            stderr = '';
        // return new Bluebird((resolve, reject) => {
        //     cp.stdout.on('data', data => {
        //         stdout += data.toString();
        //     });
        //     cp.stderr.on('data', data => {
        //         stderr += data.toString();
        //     })
        //     cp.on('close', async code => {
        //         console.log(`${this.cmpMethodName}: ${code}`)
        //         if(code === 0) {
        //             try {
        //                 console.log(this.finishMessage)
        //                 return resolve()
        //             }
        //             catch(e) {
        //                 console.error(e)
        //                 return reject(e)
        //             }
        //         }
        //         else {
        //             console.error(stderr);
        //             return reject(stderr)
        //         }
        //     })
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