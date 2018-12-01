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
    finishMessage
    timeVariable
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[], public regions) {
        super(dataRefers, schemas)
        this.scriptPath = path.join(__dirname, '../../py-scripts/sub-region-heat-map.py')
        this.finishMessage = `******sub-region-heat-map cmp finished!`;
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
            console.log(code)
            if(code === 0) {
                try {
                    let group = stdout.match(/\*\*\*\*\*\*CMIP-PY-START\n([\s\S]*)\n\*\*\*\*\*\*CMIP-PY-END/m)
                    let result =group[1].replace(/nan/g, '0')
                    result = JSON.parse(result)
                    let chartOption = this.convert2ChartOption(result)

                    let cmpResultFName = new ObjectID().toString() + '.json'
                    let cmpResultFPath = path.join(setting.geo_data.path, cmpResultFName);
                    await fs.writeFileAsync(cmpResultFPath, JSON.stringify(chartOption), 'utf8')
                    this.emit('afterCmp', cmpResultFName);
                    console.log(this.finishMessage)
                }
                catch(e) {
                    console.error(e)
                    this.emit('onCmpFailed')
                }
            }
            else {
                console.error(stderr);
                this.emit('onCmpFailed')
            }
        })
    }

    protected convert2ChartOption(data): any {
        // model-region 2d
        let chartData = [];
        let visualMapMin = _.chain(data).flattenDeep().min().value(),
            visualMapMax = _.chain(data).flattenDeep().min().value();
        (data as any).forEach((row, i) => {
            row.forEach((cell, j) => {
                chartData.push([j, i, cell])
            })
        })
        let chartOption = {
            progress: 100,
            state: CmpState.FINISHED_SUCCEED,
            xAxis: {
                type: 'category',
                data: this.regions.map((region, i) => `R${i}`),
                splitArea: { show: true }
            },
            yAxis: {
                type: 'category',
                data: this.dataRefers.map(dataRefer => dataRefer.msName),
                splitArea: { show: true},
                axisLabel: {
                    rotate: -90
                },
            },
            animation: false,
            grid: { y: '10%' },
            visualMap: {
                min: visualMapMin,
                max: visualMapMax,
                calculable: true,
                orient: "vertical",
                left: "right",
                bottom: "center"
            },
            series: [{
                name: 'value',
                type: 'heatmap',
                data: chartData,
                label: {
                    normal: { show: true}
                },
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
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

