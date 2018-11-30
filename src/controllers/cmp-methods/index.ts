import { DataRefer, UDXSchema } from '../../models';
import TableChartCMP from './site-line-chart';
import ContourMap from './bias-contour-map';
import BoxDiagram from './box-diagram';
import SubContourMap from './sub-region-bias-contour-map';
import SubHeatMap from './sub-region-heat-map';
import SubLineChart from './sub-region-line-chart';
import TaylorDiagram from './taylor-diagram';

export const CmpMethodFactory = function (methodName, dataRefers: DataRefer[], schemas: UDXSchema[]) {
    let CmpMethod;
    switch (methodName) {
        case 'Line chart':
            CmpMethod = TableChartCMP; 
            break;
        case 'Taylor diagram':
            CmpMethod = TaylorDiagram; 
            break;
        case 'Bias contour map':
            CmpMethod = ContourMap; 
            break;
        case 'Heat map':
            CmpMethod = SubHeatMap; 
            break;
        case 'Sub-region line chart':
            CmpMethod = SubLineChart; 
            break;
        case 'Sub-region bias contour map':
            CmpMethod = SubContourMap; 
            break;
        case 'Box diagram':
            CmpMethod = BoxDiagram; 
            break;
    }
    return new CmpMethod(dataRefers, schemas);
}