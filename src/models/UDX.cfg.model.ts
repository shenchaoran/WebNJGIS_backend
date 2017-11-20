export class UDXCfg {
    entrance: string;
    entries?: Array<string>;
    format?: string;
    schema: UDXSchema;
}

export class UDXSchema {
    type: SchemaType;
    externalName?: string;
    externalId?: string;
}

export enum SchemaType {
    external,
    internal
}

export enum ExternalName {
    Table_RAW
};