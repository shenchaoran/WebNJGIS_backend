import { DataRefer, GeoDataModel, UDXSchema, OGMSState, TaskModel } from '../../models';
import { ObjectID, ObjectId } from 'mongodb';
import CmpMethod from './cmp-base';
import { setting } from '../../config/setting';
import * as path from 'path';
import * as child_process from 'child_process';
import * as Bluebird from 'bluebird';
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';
import { addYears, addDays, format, parse, addHours } from 'date-fns';

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
        this.scriptPath = path.join(__dirname, '../../py-scripts/bias-contour-map.py')
        this.cmpMethodName = `bias-contour-map`;

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
        try {
            let variables = [],
            ncPaths = [],
            markerLabels = [],
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
                    `--timeLabels=${JSON.stringify(this.timeLabels)}`,
                    `--output=${output}`,
                ],
                onSucceed = async stdout => {
                    this.result = { 
                        state: OGMSState.FINISHED_SUCCEED,
                        imgPrefix: outputName,
                        timeLabels: this.timeLabels,
                        regionLength: this.regions.length,
                        ext: '[".png", ".gif"]',
                        format: '["prefix-timeLabel.png","prefix.gif"]'  // 从 1 开始
                    }
                };
            return super._start(interpretor, argv, onSucceed)
        }
        catch(e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    }
}