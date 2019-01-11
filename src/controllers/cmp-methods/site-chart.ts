import { TaskModel, DataRefer, ITaskDocument, GeoDataModel, ISchemaDocument, OGMSState } from '../../models';
import { ObjectID, ObjectId } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
import * as child_process from 'child_process';
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';

export default class SiteChart extends CmpMethod {
    scriptPath
    constructor(
        public task: ITaskDocument, 
        public metricName, 
        public methodName,
    ) {
        super(task, metricName, methodName)
        this.scriptPath = path.join(__dirname, '../../py-scripts/CMIP_site.py')
    }

    public async start() {
        try {
            let index = this.task.sites[0].index;
            let lat = this.task.sites[0].lat;
            let long = this.task.sites[0].long;
            let outputName = `${index}-${lat}-${long}-${this.metricName}-${this.methodName}-${this.task._id}.png`;
            let outputPath = path.join(__dirname, '../../public/images', this.task.isAllSTDCache? 'std-plots': 'custom-plots', outputName);
            
            let i = _.findIndex(this.task.refactored, item => item.metricName === this.metricName)
            let j = _.findIndex(this.task.refactored[i].methods, item => item.name === this.methodName)   
            let inputFilePath, inputFolder;
            if(this.task.isAllSTDCache) {
                inputFolder = path.join(setting.geo_data.path, '../std-refactor')
            }
            else {
                inputFolder = path.join(setting.geo_data.path, '../custom-refactor')
            }
            inputFilePath = path.join(inputFolder, this.task.refactored[i].fname)
            let interpretor = 'python',
                argv = [
                    this.scriptPath,
                    JSON.stringify({
                        inputFilePath: inputFilePath,
                        chart: this.methodName,
                        outputPath: outputPath,
                        metricName: this.metricName,
                    })
                ],
                onSucceed = async stdout => {
                    if(stdout.indexOf('succeed') !== -1) {
                        this.result = { 
                            state: OGMSState.FINISHED_SUCCEED,
                            img: outputName,
                            ext: '[".png"]',
                        }
                        return true
                    }
                    else if(stdout === 'failed') {
                        return false
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