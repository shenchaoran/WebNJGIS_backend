import * as _ from 'lodash';

import { ResourceSrc } from './resource.enum';

export enum ExternalName {
    TABLE_RAW,
    SHAPEFILE_RAW,
    ASCII_GRID_RAW
};

export class UDXCfg {
    entrance: string;
    entries?: Array<string>;
    format?: string;
    schema$: UDXSchema;
}

export class UDXSchema {
    src: ResourceSrc;
    externalName?: string;
    externalId?: string;
    description?: string;
    private static UDX_SCHEMAS = [
        {
            src: ResourceSrc.EXTERNAL,
            externalName: ExternalName[ExternalName.TABLE_RAW],
            externalId: 'TABLE_RAW',
            description: ''
        },
        {
            src: ResourceSrc.EXTERNAL,
            externalName: ExternalName[ExternalName.SHAPEFILE_RAW],
            externalId: 'SHAPEFILE_RAW',
            description: ''
        },
        {
            src: ResourceSrc.EXTERNAL,
            externalName: ExternalName[ExternalName.ASCII_GRID_RAW],
            externalId: 'ASCII_GRID_RAW',
            description: ''
        }
    ];

    static get schemas() {
        return UDXSchema.UDX_SCHEMAS;
    }

    static find(id: string) {
        return _.find(UDXSchema.UDX_SCHEMAS, schema => {
            return schema.externalId === id;
        });
    }
}