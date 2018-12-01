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
import { addYears, addDays, format, parse, addHours } from 'date-fns';

/**
 * 前端 echarts 可视化
 * return { value: RegionsLineChartData }
 *
 * @export
 * @class SubLineChart
 * @extends { CmpMethod }
 */
export default class SubLineChart extends SubHeatMap {
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[], regions) {
        super(dataRefers, schemas, regions)
        this.scriptPath = path.join(__dirname, '../../py-scripts/sub-region-line-chart.py')
        this.finishMessage = `******sub-region-line-chart cmp finished!`;

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
        let chartOptions = _.map(data, (modelTime2D, i) => {
            return {
                progress: 100,
                state: CmpState.FINISHED_SUCCEED,
                title: { text: `Region ${i}` },
                tooltip: { trigger: 'axis'},
                legend: {
                    data: _.map(this.dataRefers, dataRefer => dataRefer.msName),
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                toolbox: {
                    feature: { saveAsImage: {}}
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: xAxisLabels,
                },
                yAxis: {type: 'value'},
                series: _.map(modelTime2D, (timeSeries, j) => {
                    return {
                        name: this.dataRefers[j].msName,
                        type: 'line',
                        data: timeSeries
                    }
                })
            }
        })
        return chartOptions;
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
