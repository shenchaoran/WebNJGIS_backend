import * as _ from 'lodash';

export enum SchemaSrc {
    external,
    internal
}

export enum ExternalName {
    TABLE_RAW,
    SHAPEFILE_RAW,
    GRID_RAW
};

export class UDXCfg {
    entrance: string;
    entries?: Array<string>;
    format?: string;
    $schema: UDXSchema;
}

export class UDXSchema {
    type: SchemaSrc;
    externalName?: string;
    externalId?: string;
    static UDX_SCHEMAS = [
        {
            type: SchemaSrc.external,
            externalName: ExternalName.TABLE_RAW,
            externalId: 'TABLE_RAW'
        },
        {
            type: SchemaSrc.external,
            externalName: ExternalName.SHAPEFILE_RAW,
            externalId: 'SHAPEFILE_RAW'
        },
        {
            type: SchemaSrc.external,
            externalName: ExternalName.GRID_RAW,
            externalId: 'GRID_RAW'
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