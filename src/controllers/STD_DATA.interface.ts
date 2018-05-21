import * as Promise from 'bluebird';
import { 
    Event,
    CalcuTask,
 } from '../models';
import * as _ from 'lodash';

export interface STD_DATA {
    name: string;
    
    /**
     * 获取invoke 时的 cmd 参数
     * 
     * @protected
     * @memberof STD_DATA
     */
    getExeInvokeStr(stdId: string, std: CalcuTask): Promise<any>;

    downloadData(eventId: string, query: any): Promise<any>;
}

const parseCoor = (stdList) => {
    let coorE = _.find(stdList as any[], event => event.id === '-coor' || event.id === '--coordinate');
    return coorE? coorE.value: undefined;
}