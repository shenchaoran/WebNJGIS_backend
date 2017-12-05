
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

export const UDX_SCHEMAS = [
    {
        type: SchemaType.external,
        externalName: ExternalName.Table_RAW,
        externalId: '0aaf177d-d40f-4249-bcf4-4e7193f1273e'
    }
];