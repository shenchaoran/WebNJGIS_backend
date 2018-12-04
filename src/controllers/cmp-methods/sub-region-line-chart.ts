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
