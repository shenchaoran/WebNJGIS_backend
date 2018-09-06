import { UDXSchema } from './../../models/UDX-schema.class';
import TableChartCMP from './table-chart';
import { DataRefer } from '../../models';

export const CmpMethodFactory = function(methodId, dataRefers: DataRefer[], schemas: UDXSchema[], lifeCycles?: {
    afterCmp?: Function
}) {
    switch (methodId) {
        case '5b713f39a4857f1ba4be23ff':
            return new TableChartCMP(dataRefers, schemas, lifeCycles);
    }
}