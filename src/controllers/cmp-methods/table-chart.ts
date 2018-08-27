import { DataRefer } from '../../models';
import CmpMethod from './cmp-base';
import * as Promise from 'bluebird'

export default class TableChartCMP extends CmpMethod {
    constructor(dataRefers: DataRefer[]) {
        super(dataRefers)
    }

    start() {
        return new Promise((resolve, reject) => {
            
        });
    }
}