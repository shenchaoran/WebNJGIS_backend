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
import { addYears, addDays, format, parse, addHours } from 'date-fns';

/**
 * 前端 geoserver 可视化，后台将结果计算并保存起来
 *
 * @export
 * @class SubContourMap
 * @extends {CmpMethod}
 */
export default class SubContourMap extends CmpMethod {
    scriptPath
    timeVariable
    timeLabels
    cmpMethodName
    constructor(
        public dataRefers: DataRefer[], 
        public schemas: UDXSchema[], 
        public regions,
        public taskId, 
        public cmpObjIndex, 
        public methodIndex,
    ) {
        super(dataRefers, schemas, regions, taskId, cmpObjIndex, methodIndex)
        this.scriptPath = path.join(__dirname, '../../py-scripts/sub-region-contour-map.py')
        this.cmpMethodName = `sub-region-contour-map`;

        _.map(this.dataRefers, dataRefer => {
            _.map(this.schemas, schema => {
                if(!this.timeVariable && dataRefer.schemaId === schema.id) {
                    let timeVariable = _.find((schema.structure as any).variables, {name: 'time'})
                    if(timeVariable) {
                        this.timeVariable = timeVariable

                        let startDate = parse(this.timeVariable.unit + ' GMT+0')
                        let timeSpan = (this.timeVariable.end-this.timeVariable.start)/this.timeVariable.step
                        this.timeLabels = []
                        for(let i=0; i< timeSpan; i++) {
                            let endDate, timeFormat, label;
                            if(_.startsWith(this.timeVariable.unit, 'days since')) {
                                endDate = addDays(startDate, i * this.timeVariable.step)
                                timeFormat = 'YYYY-MM-DD'
                                label = format(endDate, timeFormat)
                            }
                            else if(_.startsWith(this.timeVariable.unit, 'hours since')) {
                                endDate = addHours(startDate, i * this.timeVariable.step)
                                timeFormat = 'YYYY-MM-DD HH'
                                label = format(endDate, timeFormat)
                            }
                            else {
                                label = `${i}`
                            }
                            this.timeLabels.push(label)
                        }
                    }
                }
            })
        })
    }

    public async start() {
        let variables = [],
            ncPaths = [],
            markerLabels = [],
            bboxs = this.regions,
            outputName = new ObjectId().toHexString(),
            output = path.join(__dirname, '../../public/images/plots', outputName);

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
                `--timeLabels=${JSON.stringify(this.timeLabels)}`,
                `--output=${output}`,
            ],
            onSucceed = async () => {
                this.result = { 
                    state: CmpState.FINISHED_SUCCEED,
                    imgPrefix: outputName,
                    timeLabels: this.timeLabels,
                    regionLength: this.regions.length,
                    ext: '[".png", ".gif"]',
                    format: '["prefix-timeLabel-R1.png","prefix-R1.gif"]'  // 从 1 开始
                }
                console.log(outputName)
            }
        return super._start(interpretor, argv, onSucceed);
    }
}