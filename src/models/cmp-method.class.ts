import * as _ from 'lodash';

export class CmpMethod {
    label: string;
    value: string;

    private static METHODS = {
        TABLE_RAW: [
            {
                label: 'Chart',
                value: 'TABLE_CHART'
            },
            {
                label: 'Statistic',
                value: 'TABLE_STATISTIC'
            }
        ],
        SHAPEFILE_RAW: [
            {
                label: 'Visualization',
                value: 'SHAPEFILE_VISUALIZATION'
            },
            {
                label: 'Statistic',
                value: 'SHAPEFILE_STATISTIC'
            },
            {
                label: 'Interpolation',
                value: 'SHAPEFILE_INTERPOLATION'
            }
        ],
        ASCII_GRID_RAW: [
            {
                label: 'Visualization',
                value: 'ASCII_GRID_VISUALIZATION'
            },
            {
                label: 'Statistic',
                value: 'ASCII_GRID_STATISTIC'
            },
            {
                label: 'GIF',
                value: 'GIF'
            }
        ]
    };

    static find(schemaName: string) {
        return _.get(CmpMethod.METHODS, schemaName);
    }
}

export enum CmpMethodEnum {
  TABLE_CHART,
  TABLE_STATISTIC,
  SHAPEFILE_VISUALIZATION,
  SHAPEFILE_STATISTIC,
  SHAPEFILE_INTERPOLATION,
  ASCII_GRID_VISUALIZATION,
  ASCII_GRID_STATISTIC,
  GIF
}
