
import { STD_DATA } from './STD_DATA.interface';
import * as  Promise from 'bluebird';import * as proj4x from 'proj4';
const proj4 = (proj4x as any).proj4;
import * as _ from 'lodash';
import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as path from 'path';
const fs = Promise.promisifyAll(require('fs'));
import {
    Event,
    CalcuTask,
    stdDataDB,
    geoDataDB,
    siteDB,
} from '../models';

export class BIOME_BGC_STD_DATA implements STD_DATA {
    name = 'BIOME_BGC_STD_DATA';
    inputPath = setting.STD_DATA.IBIS_STD_DATA.inputPath;
    outputPath = setting.STD_DATA.IBIS_STD_DATA.outputPath;
    getExeInvokeStr(stdId: string, std: CalcuTask): Promise<any> {
        return ;
    }

    downloadData(eventId: string, query: any): Promise<any> {
        return ;
    }
}