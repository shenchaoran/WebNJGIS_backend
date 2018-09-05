import { DataRefer, geoDataDB } from '../../models';
import CmpMethod from './cmp-base';
import * as Bluebird from 'bluebird'

export default class TableChartCMP extends CmpMethod {
    constructor(public dataRefers: DataRefer[]) {
        super(dataRefers)
    }

    async initialization(): Promise<any> {
        
    }

    /**
     * @returns {echart-opt, statisticTable}
     */
    async start(): Promise<any> {
        Bluebird.map(this.dataRefers, dataRefer => geoDataDB.findOne({
            _id: dataRefer
        }))
    }

    async extractData(): Promise<any> {

    }
}