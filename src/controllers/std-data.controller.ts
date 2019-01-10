import { StdDataModel, SchemaModel } from '../models';
import * as proj4x from 'proj4';
const proj4 = (proj4x as any).proj4;
import { SiteModel } from '../models';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as RequestCtrl from '../utils/request.utils';
import { setting } from '../config/setting';
import * as path from 'path';
import * as fs from 'fs';

export default class STDDataCtrl {
    constructor() {}
    async download(id, entryName) {
        try {
            let stdData = await StdDataModel.findOne({ _id: id });
            let entry = _.find(stdData.entries, entry => entry.name === entryName);
            let ext = entry.path.substr(entry.path.lastIndexOf('.'))
            let fname = entry.name + ext;
            let stream = fs.createReadStream(path.join(setting.geo_data.path, entry.path)); 
            return { stream, fname };
        }
        catch(e) {
            return Bluebird.reject(e);
        }
    }
}