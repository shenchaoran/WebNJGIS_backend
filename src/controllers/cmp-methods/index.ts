import { DataRefer, UDXSchema } from '../../models';
import TableChartCMP from './site-line-chart';
import ContourMap from './bias-contour-map';
import BoxDiagram from './box-diagram';
import SubContourMap from './sub-region-bias-contour-map';
import SubHeatMap from './sub-region-heat-map';
import SubLineChart from './sub-region-line-chart';
import TaylorDiagram from './taylor-diagram';

export const CmpMethodFactory = function (methodName, dataRefers: DataRefer[], schemas: UDXSchema[], regions?) {
    let CmpMethod;
    switch (methodName) {
        case 'table series visualization':
            return new TableChartCMP(dataRefers, schemas)
        case 'Line chart':
            return new TableChartCMP(dataRefers, schemas)
        case 'Taylor diagram':
            return new TaylorDiagram(dataRefers, schemas)
        case 'Bias contour map':
            return new ContourMap(dataRefers, schemas)
        case 'Heat map':
            return new SubHeatMap(dataRefers, schemas, regions)
        case 'Sub-region line chart':
            return new SubLineChart(dataRefers, schemas, regions)
        case 'Sub-region bias contour map':
            return new SubContourMap(dataRefers, schemas)
        case 'Box diagram':
            return new BoxDiagram(dataRefers, schemas)
    }
}