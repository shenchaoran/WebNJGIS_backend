import { DataRefer, geoDataDB, UDXSchema, CmpState } from '../../models';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird';
import * as Papa from 'papaparse';
import { setting } from '../../config/setting';
import * as path from 'path';
const fs = Bluebird.promisifyAll(require('fs'));

export default class TableChartCMP extends CmpMethod {
    constructor(public dataRefers: DataRefer[], public schemas: UDXSchema[], public methodId) {
        super(dataRefers, schemas)
    }

    /**
     * @returns {echart-opt, statisticTable}
     */
    async start() {
        let dataRefers = this.dataRefers.filter(v => !!v.value);
        Bluebird.map(dataRefers, async dataRefer => {
            let geoData = await geoDataDB.findOne({ _id: dataRefer.value });
            let fpath = path.join(setting.geo_data.path, geoData.meta.path);
            this.extractCSVColumn(dataRefer, fpath).then(async cols => {
                if (cols.length) {
                    let opt = {
                        progress: 100,
                        state: CmpState.FINISHED_SUCCEED,
                        xAxis: {
                            type: 'category',
                            data: new Array((cols[0] as any).length).fill(0).map((v, i) => i + 1)
                        },
                        legend: {
                            data: dataRefers.map(v => `${v.msrName}: ${v.eventName}`)
                        },
                        yAxis: {
                            type: 'value'
                        },
                        dataZoom: [
                            {
                                show: true,
                                start: 0,
                                end: 100
                            },
                            {
                                type: 'inside',
                                realtime: true,
                                start: 0,
                                end: 100
                            }
                        ],
                        series: cols.map((col, i) => {
                            return {
                                name: `${dataRefers[i].msrName}: ${dataRefers[i].eventName}`,
                                data: col,
                                type: 'line'
                            }
                        })
                    };
                    let extI = fpath.lastIndexOf('.');
                    let targetFPath = `${fpath.substring(0 ,extI)}-${this.methodId}${fpath.substring(extI)}`;
                    await fs.writeFileAsync(targetFPath, JSON.stringify(opt), 'utf8')
                    this.emit('afterCmp', targetFPath);
                    console.log(`******table chart cmp finished!`)
                }
            })
        })
    }

    protected async extractCSVColumn(dataRefer, fpath) {
        try {
            let column = []
            console.log('******csv path: ', fpath)
            let csv$ = fs.createReadStream(fpath, 'utf8');
            let schema = this.schemas.find(v => v.id === dataRefer.schemaId && v.msId === dataRefer.msId);
            let colNum = schema.structure.columns.findIndex(col => col.id === dataRefer.field)
            await new Bluebird((resolve, reject) => {
                csv$.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {
                    header: false,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                }))
                    .on('data', item => {
                        let scale = parseInt((schema.structure.columns[colNum] as any).unitScale);
                        column.push(item[colNum] * scale);
                    })
                    .on('end', () => {
                        resolve(column)
                    })
                    .on('error', reject)
            });
            return column;
        }
        catch(e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    }
}