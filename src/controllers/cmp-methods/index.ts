import { DataRefer, ISchemaDocument, TaskModel, CmpObj } from '../../models';
import * as _ from 'lodash';
// import TableChartCMP from './line-chart';
// import ContourMap from './bias-contour-map';
// import BoxDiagram from './box-diagram';
// import SubHeatMap from './sub-region-heat-map';
// import SubLineChart from './sub-region-line-chart';
// import TaylorDiagram from './taylor-diagram';
// import ScatterDiagram from './scatter-diagram';
import SiteChart from './site-chart';
import * as postal from 'postal';

export const CmpMethodFactory = function (
    task, 
    metricName,
    methodName, 
) {
    let CmpMethod;
    switch (methodName) {
        case 'Line chart':
        case 'Taylor diagram':
        case 'Box diagram':
        case 'Scatter diagram':
            return new SiteChart(task, metricName, methodName)
        // case 'Bias contour map':
        //     CmpMethod = ContourMap;
        //     break
        // case 'Heat map':
        //     CmpMethod = SubHeatMap;
        //     break
        // case 'Sub-region line chart':
        //     CmpMethod = SubLineChart;
        //     break
    }
    // return new CmpMethod(dataRefers, regions, taskId, cmpObjIndex, methodIndex);
}

postal.channel('child-process').subscribe('start', async ({taskId, metricName, methodName}) => {
    let task = await TaskModel.findOne({_id: taskId})
    let cmpMethod = CmpMethodFactory(
        task, 
        metricName, 
        methodName, 
    );
    await cmpMethod.start().catch(e => {
        // console.log(`******** cmp failed: ${methodName}`)
    });
})