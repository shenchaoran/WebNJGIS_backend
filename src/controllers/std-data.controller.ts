import { stdDataDB } from '../models';
import * as proj4x from 'proj4';
const proj4 = (proj4x as any).proj4;
import { siteDB } from '../models';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as RequestCtrl from '../utils/request.utils';
import { setting } from '../config/setting';

export const preview = (id, cfg): Bluebird<any> => {
    return stdDataDB.findOne({ _id: id })
    //     .then(doc => {
    //         if (doc.meta.name === 'IBIS meteorological data') {
    //             let point;
    //             if (cfg.method === 'map') {
    //                 if (cfg.geojson.coordinates.length !== 2) {
    //                     return Bluebird.reject('invalid position!');
    //                 }
    //                 const x = cfg.geojson.coordinates[0];
    //                 const y = cfg.geojson.coordinates[1];
    //                 point = getPointPosition(cfg.method, x, y);
    //             }
    //             else if (cfg.method === 'lat&long') {
    //                 point = getPointPosition(cfg.method, cfg.lat, cfg.long);
    //             }
    //             else if (cfg.method === 'row&col') {
    //                 point = getPointPosition(cfg.method, cfg.col, cfg.row);
    //             }
    //             return Bluebird.resolve({
    //                 type: 'point',
    //                 cfg: point
    //             });
    //         }
    //         else {
    //             return Bluebird.reject('invalid STD data type!');
    //         }
    //     })
    //     // .then(requestData)
    //     .then(file => {

        // })
        .catch(Bluebird.reject);
}

export const download = (id, cfg) => {
    return stdDataDB.findOne({ _id: id })
        // .then(doc => {
        //     if (doc.meta.name === 'IBIS meteorological data') {
        //         let region;
        //         if (cfg.method === 'map') {
        //             if (cfg.geojson.coordinates.length !== 2) {
        //                 return Bluebird.reject('invalid position!');
        //             }
        //             const coors = _.get(cfg, 'geojson.coordinates[0]');
        //             const rows = [];
        //             const cols = [];
        //             _.map(coors as any, point => {
        //                 const p = getPointPosition(cfg.method, point[0], point[1]);
        //                 rows.push(p.row);
        //                 cols.push(p.col);
        //             });
        //             region = {
        //                 startRow: _.min(rows),
        //                 startCol: _.min(cols),
        //                 endRow: _.max(rows),
        //                 endCol: _.max(cols)
        //             };
        //         }
        //         else if (cfg.method === 'lat&long') {
        //             const p1 = getPointPosition(cfg.method, cfg.startLat, cfg.startLong);
        //             const p2 = getPointPosition(cfg.method, cfg.startLat, cfg.startLong);
        //             region = {
        //                 startRow: p1.row,
        //                 startCol: p1.col,
        //                 endRow: p2.row,
        //                 endCol: p2.col
        //             };
        //         }
        //         else if (cfg.method === 'row&col') {
        //             region = {
        //                 startRow: cfg.startRow,
        //                 startCol: cfg.startCol,
        //                 endRow: cfg.endRow,
        //                 endCol: cfg.endCol
        //             }
        //         }
        //         return Bluebird.resolve({
        //             type: 'region',
        //             cfg: region
        //         });
        //     }
        //     else {
        //         return Bluebird.reject('invalid STD data type!');
        //     }
        // })
        // .then(requestData)
        // .then(response => {
        //     let fname = response.headers['Content-Disposition'];
        //     fname = fname.substring(fname.indexOf('filename=') + 9);
        //     return Bluebird.resolve({
        //         length: response.headers['content-length'],
        //         data: response.body,
        //         filename: fname
        //     });
        // })
        .catch(Bluebird.reject);
}
