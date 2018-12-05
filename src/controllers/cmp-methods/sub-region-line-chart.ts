import { DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
import SubHeatMap from './sub-region-heat-map'
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';
import * as child_process from 'child_process';
import { addYears, addDays, format, parse, addHours } from 'date-fns';

/**
 * 前端 echarts 可视化
 * return { value: RegionsLineChartData }
 *
 * @export
 * @class SubLineChart
 * @extends { CmpMethod }
 */
export default class SubLineChart extends CmpMethod {
    scriptPath;
    timeVariable;
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[], public regions) {
        super(dataRefers, schemas)
        this.scriptPath = path.join(__dirname, '../../py-scripts/sub-region-line-chart.py')
        this.cmpMethodName = `sub-region-line-chart`;

        _.map(this.dataRefers, dataRefer => {
            _.map(this.schemas, schema => {
                if(!this.timeVariable && dataRefer.schemaId === schema.id) {
                    let timeVariable = _.find((schema.structure as any).variables, {name: 'time'})
                    if(timeVariable) {
                        this.timeVariable = timeVariable
                    }
                }
            })
        })
    }

    public async start() {
        let bboxs = this.regions,
            variables = [],
            ncPaths = [];
        let tmps = await Bluebird.map(this.dataRefers, async dataRefer => {
            let geoData = await GeoDataModel.findOne({ _id: dataRefer.value });
            let fpath = path.join(setting.geo_data.path, geoData.meta.path);
            return {fpath, variable: dataRefer.field}
        });
        _.map(tmps, tmp => {
            variables.push(tmp.variable)
            ncPaths.push(tmp.fpath)
        })

        // let bboxs = "[[-73.125, -51.9442648790288,-45,16.1302620120348], [-17.578125,-36.4566360115962, 49.21875, 36.1733569352216 ], [ 75.234375, 14.0939571778362, 132.890625, 50.4015153227824 ], [ 105.46875, -40.8470603560712, 161.015625, -10.3149192858131 ], [ 131.484375, 29.0753751795583, 149.765625, 44.7155137320213 ], [ 51.328125, 51.2894059027168, 170.859375, 74.4493575006342 ], [ -1.40625, 57.0407298383609, 43.59375, 72.867930498614 ], [ -13.359375, 38.4105582509461, 40.78125, 57.0407298383609 ], [ -146.953125, 49.951219908662, -47.109375, 70.6708810701575 ], [ -144.140625, 20.1384703124511, -59.765625, 49.4966745274704]]",
        //     variables = "['all_lai', 'aylail']",
        //     ncPaths = "['src/py-scripts/data/Biome-BGC-out.nc', 'src/py-scripts/data/IBIS-out.nc']";
        return new Bluebird((resolve, reject) => {
            const cp = child_process.spawn('python', [
                this.scriptPath,
                `--bboxs=${JSON.stringify(bboxs)}`,
                `--variables=${JSON.stringify(variables)}`,
                `--ncPaths=${JSON.stringify(ncPaths)}`
            ])
            let stdout = '',
                stderr = '';
            cp.stdout.on('data', data => {
                stdout += data.toString();
            });
            cp.stderr.on('data', data => {
                stderr += data.toString();
            })
            cp.on('close', async code => {
                console.log(`${this.cmpMethodName}: ${code}`)
                if(code === 0) {
                    try {
                        let group = stdout.match(/\*\*\*\*\*\*CMIP-PY-START\n([\s\S]*)\n\*\*\*\*\*\*CMIP-PY-END/m)
                        let result =group[1].replace(/nan/g, '0')
                        result = JSON.parse(result)
                        let chartOption = this.convert2ChartOption(result)
    
                        let cmpResultFName = new ObjectID().toString() + '.json'
                        let cmpResultFPath = path.join(setting.geo_data.path, cmpResultFName);
                        await fs.writeFileAsync(cmpResultFPath, JSON.stringify(chartOption), 'utf8')
                        this.result = cmpResultFName;
                        console.log(this.finishMessage)
                        return resolve();
                    }
                    catch(e) {
                        console.error(e)
                        return reject(e)
                    }
                }
                else {
                    console.error(stderr);
                    return reject(stderr)
                }
            })
        })
    }

    protected convert2ChartOption(data): any {
        // region-model-time 3d-array
        let startDate = parse(this.timeVariable.unit + ' GMT+0')
        let timeSpan = (this.timeVariable.end-this.timeVariable.start)/this.timeVariable.step
        let xAxisLabels = []
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
            xAxisLabels.push(label)
        }
        let grids = [],
            xAxes = [],
            yAxes = [],
            series = [],
            titles = [],
            // colNumber = Math.ceil(Math.sqrt(this.regions.length)),
            colNumber = 4,
            rowNumber = Math.ceil(this.regions.length/colNumber);
        for(let [i, modelTime2D] of data.entries()) {
            grids.push({
                show: true,
                borderWidth: 0,
                backgroundColor: '#fff',
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowBlur: 1,
                left: ((i % colNumber) / colNumber * 100 + (1 / colNumber * 100)*0.2) + '%',
                top: (Math.floor(i / colNumber) / rowNumber * 100 + (1 / rowNumber * 100)*0.4) + '%',
                width: (1 / colNumber * 100)*0.6 + '%',
                height: (1 / rowNumber * 100)*0.4 + '%',
            });
            titles.push({
                textAlign: 'center',
                text: `Region ${i+1}`,
                textStyle: {
                    fontSize: 12,
                    fontWeight: 'normal'
                },
                left: parseFloat(grids[i].left) + parseFloat(grids[i].width) / 2 + '%',
                top: parseFloat(grids[i].top) - (1 / rowNumber * 100)*0.2 + '%',
            });
            xAxes.push({
                type: 'category',
                boundaryGap: false,
                data: xAxisLabels,
                gridIndex: i
            });
            yAxes.push({
                type: 'value',
                gridIndex: i
            });
            modelTime2D.map((timeSeries, j) => {
                series.push({
                    name: this.dataRefers[j].msName,
                    type: 'line',
                    xAxisIndex: i,
                    yAxisIndex: i,
                    showSymbol: false,
                    data: timeSeries
                })
            });
        }
        let chartOption = {
            progress: 100,
            state: CmpState.FINISHED_SUCCEED,
            title: titles,
            tooltip: { trigger: 'axis'},
            legend: {
                data: _.map(this.dataRefers, dataRefer => dataRefer.msName),
            },
            grid: grids,
            toolbox: { feature: { saveAsImage: {}} },
            xAxis: xAxes,
            yAxis: yAxes,
            series: series
        }
        return chartOption;
    }
}


class RegionsLineChartData {
    variableName: string;       // 要素名
    regions: {                  // dimension 1
        name: string;
        bbox: number[];
    }[];
    models: {                   // dimension 2
        msName: string;
        msId: string;
    }[];
    times: {                    // dimension 3
        label: string;
        value: number;
    }[];
    matrix: [][][];             // 三维矩阵，保存统计指标
}
