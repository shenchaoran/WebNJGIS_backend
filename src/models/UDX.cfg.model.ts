import {
    UDX_SCHEMAS,
    UDXSchema
} from './UDX.schema.model';

export class UDXCfg {
    entrance: string;
    entries?: Array<string>;
    format?: string;
    schema: UDXSchema;
}
