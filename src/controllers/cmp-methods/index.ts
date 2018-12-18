import { DataRefer, UDXSchema } from '../../models';
import TableChartCMP from './site-line-chart';
import ContourMap from './bias-contour-map';
import BoxDiagram from './box-diagram';
import SubHeatMap from './sub-region-heat-map';
import SubLineChart from './sub-region-line-chart';
import TaylorDiagram from './taylor-diagram';
import ScatterDiagram from './scatter-diagram';

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