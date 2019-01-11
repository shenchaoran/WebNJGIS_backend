import { DataRefer, ISchemaDocument, TaskModel, CmpObj } from '../../models';
import * as _ from 'lodash';
import TableChartCMP from './line-chart';
import ContourMap from './bias-contour-map';
import BoxDiagram from './box-diagram';
import SubHeatMap from './sub-region-heat-map';
import SubLineChart from './sub-region-line-chart';
import TaylorDiagram from './taylor-diagram';
import ScatterDiagram from './scatter-diagram';
import SiteChart from './site-chart';
import * as postal from 'postal';

export const CmpMethodFactory = function (
    methodName, 
    dataRefers: DataRefer[], 
    regions,
    taskId, 
    cmpObjIndex, 
    methodIndex,
) {
    let CmpMethod;
    switch (methodName) {
        case 'Line chart':
        case 'Taylor diagram':
        case 'Box diagram':
        case 'Scatter diagram':
            return new SiteChart(methodName, dataRefers)
        case 'Bias contour map':
            CmpMethod = ContourMap;
            break
        case 'Heat map':
            CmpMethod = SubHeatMap;
            break
        case 'Sub-region line chart':
            CmpMethod = SubLineChart;
            break
    }
    return new CmpMethod(dataRefers, regions, taskId, cmpObjIndex, methodIndex);
}

postal.channel('child-process').subscribe('start', async ({taskId, cmpObjId, methodId}) => {
    let task = await TaskModel.findOne({_id: taskId})
    if(!task) return false
    let i = _.findIndex(task.cmpObjs, { id: cmpObjId})
    if(i === -1) return false
    let cmpObj: CmpObj = task.cmpObjs[i]
    let j = _.findIndex(cmpObj.methods, {id: methodId});
    if(j === -1) return false
    let method = cmpObj.methods[j];
    let cmpMethod = CmpMethodFactory(
        method.name, 
        cmpObj.dataRefers, 
        task.regions,
        task._id, 
        i, 
        j
    );
    await cmpMethod.start().catch(e => {
        console.log(`******** cmp failed: ${method.name}`)
    });
})