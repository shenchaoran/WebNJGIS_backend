import { Mongoose } from './mongoose.base';
import { UDXSchema } from './UDX-schema.class';
import { UDXCfg } from './UDX-cfg.class';
import * as mongoose from 'mongoose';
import { ResourceSrc } from './resource.enum';

class GeoDataDB extends Mongoose {
    constructor() {
        const collectionName = 'Geo_Data';
        const schema = {
            file: mongoose.Schema.Types.Mixed,
            auth: mongoose.Schema.Types.Mixed,
            udxcfg: mongoose.Schema.Types.Mixed
        };

        super(collectionName, schema);
    }
}

export const geoDataDB = new GeoDataDB();

export class GeoDataClass {
    _id?: any;

    file?: {
        name: string,
        path: string,
    };

    auth: {
        permission?: string,
        userId: string,
        src: ResourceSrc
    };
    
    udxcfg: UDXCfg;
}

export enum STD_DATA_FEATURE {
    TA = 0,
    TMIN,
    TMAX,
    CLOUD,
    RH,
    PS,
    PREC,
    WIND
}

export const STD_DATA = {
    temporal: {
        start: (new Date(1979, 0, 1, 0, 0, 0)).getTime(),
        end: (new Date(1988, 11, 31, 24, 0, 0)).getTime(),
        scale: 'DAY'
    },
    spatial: {
        cols: 540,
        rows: 360
    },
    features: [
        'TA',
        'TMIN',
        'TMAX',
        'CLOUD',
        'RH',
        'PS',
        'PREC',
        'WIND'
    ]
}