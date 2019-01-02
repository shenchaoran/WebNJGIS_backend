import { DataRefer, UDXSchema, TaskModel, CmpObj } from '../../models';
import * as _ from 'lodash';
import TableChartCMP from './site-line-chart';
import ContourMap from './bias-contour-map';
import BoxDiagram from './box-diagram';
import SubHeatMap from './sub-region-heat-map';
import SubLineChart from './sub-region-line-chart';
import TaylorDiagram from './taylor-diagram';
import ScatterDiagram from './scatter-diagram';
import * as postal from 'postal';

export const CmpMethodFactory = function (
    methodName, 
    dataRefers: DataRefer[], 
    schemas: UDXSchema[], 
    regions,
    taskId, 
    cmpObjIndex, 
    methodIndex,
) {
    let CmpMethod;
    switch (methodName) {
        case 'table series visualization':
            CmpMethod = TableChartCMP;
            break
        case 'Line chart':
            CmpMethod = TableChartCMP;
            break
        case 'Taylor diagram':
            CmpMethod = TaylorDiagram;
            break
        case 'Bias contour map':
            CmpMethod = ContourMap;
            break
        case 'Heat map':
            CmpMethod = SubHeatMap;
            break
        case 'Sub-region line chart':
            CmpMethod = SubLineChart;
            break
        case 'Box diagram':
            CmpMethod = BoxDiagram;
            break
        case 'Scatter diagram':
            CmpMethod = ScatterDiagram
            break
    }
    return new CmpMethod(dataRefers, schemas, regions, taskId, cmpObjIndex, methodIndex);
}

postal.channel('child-process').subscribe('start', async (data, envelope) => {
    let task = await TaskModel.findOne({_id: data.taskId})
    if(!task) return false
    let i = _.findIndex(task.cmpObjs, { id: data.cmpObjId})
    if(i === -1) return false
    let cmpObj: CmpObj = task.cmpObjs[i]
    let j = _.findIndex(cmpObj.methods, {id: data.methodId});
    if(j === -1) return false
    let method = cmpObj.methods[j];
    let cmpMethod = CmpMethodFactory(
        method.name, 
        cmpObj.dataRefers, 
        task.schemas, 
        task.regions,
        task._id, 
        i, 
        j
    );
    await cmpMethod.start().catch(e => {
        console.log(`******** cmp failed: ${method.name}`)
    });
})