import { TaskModel, DataRefer, GeoDataModel, UDXSchema, OGMSState } from '../../models';
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
 * 
 *
 * @export
 * @class BoxDiagram
 * @extends {CmpMethod}
 */
export default class BoxDiagram extends CmpMethod {
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
        this.scriptPath = path.join(__dirname, '../../py-scripts/sub-region-box-diagram.py')
        this.cmpMethodName = `sub-region-box-diagram`;
    }

    public async start() {
        try {
            let variables = [],
            ncPaths = [],
            markerLabels = [],
            outputName = new ObjectId().toHexString() + '.png',
            output = path.join(__dirname, '../../public/images/plots', outputName),
            bboxs = this.regions;
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
                    `--bboxs=${JSON.stringify(bboxs)}`,
                    `--output=${output}`,
                ],
                onSucceed = async stdout => {
                    this.result = { 
                        state: OGMSState.FINISHED_SUCCEED,
                        img: outputName,
                        ext: '[".png"]',
                    }
                };
            return super._start(interpretor, argv, onSucceed)
        }
        catch(e) {
            console.error(e)
            Bluebird.reject(e)
        }
    }
}