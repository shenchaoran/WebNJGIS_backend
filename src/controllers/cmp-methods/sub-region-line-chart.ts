import { DataRefer, GeoDataModel, UDXSchema, OGMSState } from '../../models';
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
    constructor(
        public dataRefers: DataRefer[], 
        public schemas: UDXSchema[], 
        public regions,
        public taskId, 
        public cmpObjIndex, 
        public methodIndex,
    ) {
        super(dataRefers, schemas, regions, taskId, cmpObjIndex, methodIndex)
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
        try {
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

            let interpretor = 'python',
                argv = [
                    this.scriptPath,
                    `--bboxs=${JSON.stringify(bboxs)}`,
                    `--variables=${JSON.stringify(variables)}`,
                    `--ncPaths=${JSON.stringify(ncPaths)}`
                ],
                onSucceed = async (stdout) => {
                    let group = stdout.match(/\*\*\*\*\*\*\*\* CMIP-PY-START\n([\s\S]*)\n\*\*\*\*\*\*\*\* CMIP-PY-END/m)
                    let result =group[1].replace(/nan/g, '0')
                    result = JSON.parse(result)
                    let chartOption = this.convert2ChartOption(result)

                    let cmpResultFName = new ObjectID().toString() + '.json'
                    let cmpResultFPath = path.join(setting.geo_data.path, cmpResultFName);
                    await fs.writeFileAsync(cmpResultFPath, JSON.stringify(chartOption), 'utf8')
                    this.result = cmpResultFName;
                };
            return super._start(interpretor, argv, onSucceed)
        }
        catch(e) {
            console.error(e)
            Bluebird.reject(e)
        }
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
            colNumber = 3,
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
            state: OGMSState.FINISHED_SUCCEED,
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
