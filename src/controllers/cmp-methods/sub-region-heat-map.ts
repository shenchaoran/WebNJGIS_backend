import { DataRefer, GeoDataModel, UDXSchema, CmpState } from '../../models';
import { ObjectID } from 'mongodb';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
import * as child_process from 'child_process';
const fs = Bluebird.promisifyAll(require('fs'));
import * as _ from 'lodash';

/**
 * 前端 echarts 可视化
 * return {                 // 5 个热力图
 *      value: RegionsHeatMapData,
 *      bias: RegionsHeatMapData,
 *      std: RegionsHeatMapData,
 *      correlation: RegionsHeatMapData,
 *      RMSE: RegionsHeatMapData,
 * }
 *
 * @export
 * @class SubHeatMap
 * @extends {CmpMethod}
 */
export default class SubHeatMap extends CmpMethod {
    scriptPath
    timeVariable
    constructor(
        public dataRefers: DataRefer[], 
        public schemas: UDXSchema[], 
        public regions,
        public taskId, 
        public cmpObjIndex, 
        public methodIndex,
    ) {
        super(dataRefers, schemas, regions, taskId, cmpObjIndex, methodIndex)
        this.scriptPath = path.join(__dirname, '../../py-scripts/sub-region-heat-map.py')
        this.cmpMethodName = `sub-region-heat-map`;
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

        let interpretor = 'python',
            argv = [
                this.scriptPath,
                `--bboxs=${JSON.stringify(bboxs)}`,
                `--variables=${JSON.stringify(variables)}`,
                `--ncPaths=${JSON.stringify(ncPaths)}`
            ],
            onSucceed = async (stdout) => {
                let group = stdout.match(/\*\*\*\*\*\*CMIP-PY-START\n([\s\S]*)\n\*\*\*\*\*\*CMIP-PY-END/m)
                let result =group[1].replace(/nan/g, '0')
                result = JSON.parse(result)
                let chartOption = this.convert2ChartOption(result)

                let cmpResultFName = new ObjectID().toString() + '.json'
                let cmpResultFPath = path.join(setting.geo_data.path, cmpResultFName);
                await fs.writeFileAsync(cmpResultFPath, JSON.stringify(chartOption), 'utf8')
                this.result = cmpResultFName;
            };
        return super._start(interpretor, argv, onSucceed);
    }

    protected convert2ChartOption(data): any {
        // stat-model-region 3d
        // mean, std, bias, coef, rmse
        let grids = [],
            xAxes = [],
            yAxes = [],
            series = [],
            titles = [],
            visualMaps = [],
            titleLabels = ['Mean', 'Bias', 'Standard Deviation', 'Correlation Coefficient', 'RMSE'],
            // colNumber = Math.ceil(Math.sqrt(titleLabels.length)),
            colNumber = 1,
            rowNumber = Math.ceil(titleLabels.length/colNumber);
        for(let [i, modelRegion2d] of data.entries()) {
            let seriesData = []
            modelRegion2d.map((row, j) => {
                row.map((cell, k) => {
                    seriesData.push([k, j, cell])
                })
            })
            grids.push({
                show: true,
                borderWidth: 0,
                backgroundColor: '#fff',
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowBlur: 1,
                left: ((i % colNumber) / colNumber * 100 + (1 / colNumber * 100)*0.2) + '%',
                top: (Math.floor(i / colNumber) / rowNumber * 100 + (1 / rowNumber * 100)*0.3) + '%',
                width: (1 / colNumber * 100)*0.65 + '%',
                height: (1 / rowNumber * 100)*0.5 + '%',
            });
            visualMaps.push({
                min: _.chain(modelRegion2d).flattenDeep().min().value(),
                max: _.chain(modelRegion2d).flattenDeep().max().value(),
                itemWidth: 8,
                itemHeight: 40,
                calculable: true,
                orient: 'vertical',
                left: (((i % colNumber)+1) / colNumber * 100 - (1 / colNumber * 100)*0.15) + '%',
                top: grids[i].top,
                seriesIndex: i,
            });
            titles.push({
                textAlign: 'center',
                text: titleLabels[i],
                textStyle: {
                    fontSize: 12,
                    fontWeight: 'normal'
                },
                left: parseFloat(grids[i].left) + parseFloat(grids[i].width) / 2 + '%',
                top: parseFloat(grids[i].top) - (1 / rowNumber * 100)*0.2 + '%',
            });
            xAxes.push({
                type: 'category',
                data: new Array(this.regions.length).fill(0).map((v, regionIndex) => `R${regionIndex+1}`),
                splitArea: {show: true},
                gridIndex: i,
            });
            yAxes.push({
                type: 'category',
                data: _.map(this.dataRefers, 'msName'),
                splitArea: {show: true},
                // axisLabel: {rotate: -90},
                gridIndex: i
            });
            series.push({
                name: titleLabels[i],
                type: 'heatmap',
                xAxisIndex: i,
                yAxisIndex: i,
                data: seriesData,
                itemStyle: {
                    emphasis: {
                        shadowBlur: 3,
                        shadowColor: 'rgba(0,0,0,0.2)'
                    }
                },
            });
        }
        
        
        let chartOption = {
            progress: 100,
            tooltip: {
                position: "top"
            },
            state: CmpState.FINISHED_SUCCEED,
            title: titles,
            xAxis: xAxes,
            yAxis: yAxes,
            animation: false,
            grid: grids,
            visualMap: visualMaps,
            series: series
        };
        return chartOption;
    }
}


class RegionsHeatMapData {
    variableName: string;       // 要素名
    regions: {                  // 矩阵的行名
        name: string;
        bbox: number[];         // 子区域坐标
    }[];
    models: {                   // 矩阵的列名
        msName: string;
        msId: string;
    }[];
    matrix: [][];               // 二维矩阵，保存统计指标：算出所有子区域的值后归一化到 [0, 1]
}

