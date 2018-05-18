import { stdDataDB } from '../models';
import * as proj4x from 'proj4';
const proj4 = (proj4x as any).proj4;
import { siteDB } from '../models';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as StdDataProcesser from './std-data-process.controller';

export const preview = (id, cfg): Promise<any> => {
    return stdDataDB.findOne({ _id: id })
        .then(doc => {
            if (doc.meta.name === 'IBIS meteorological data') {
                let point;
                if (cfg.method === 'map') {
                    if (cfg.geojson.coordinates.length !== 2) {
                        return Promise.reject('invalid position!');
                    }
                    const x = cfg.geojson.coordinates[0];
                    const y = cfg.geojson.coordinates[1];
                    point = getPointPosition(cfg.method, x, y);
                }
                else if (cfg.method === 'lat&long') {
                    point = getPointPosition(cfg.method, cfg.lat, cfg.long);
                }
                else if (cfg.method === 'row&col') {
                    point = getPointPosition(cfg.method, cfg.col, cfg.row);
                }
                return Promise.resolve({
                    type: 'point',
                    cfg: point
                });
            }
            else {
                return Promise.reject('invalid STD data type!');
            }
        })
        .then(requestData)
        .then(file => {

        })
        .catch(Promise.reject);
}

export const download = (id, cfg) => {
    return stdDataDB.findOne({ _id: id })
        .then(doc => {
            if (doc.meta.name === 'IBIS meteorological data') {
                let region;
                if (cfg.method === 'map') {
                    if (cfg.geojson.coordinates.length !== 2) {
                        return Promise.reject('invalid position!');
                    }
                    const coors = _.get(cfg, 'geojson.coordinates[0]');
                    const rows = [];
                    const cols = [];
                    _.map(coors as any, point => {
                        const p = getPointPosition(cfg.method, point[0], point[1]);
                        rows.push(p.row);
                        cols.push(p.col);
                    });
                    region = {
                        startRow: _.min(rows),
                        startCol: _.min(cols),
                        endRow: _.max(rows),
                        endCol: _.max(cols)
                    };
                }
                else if (cfg.method === 'lat&long') {
                    const p1 = getPointPosition(cfg.method, cfg.startLat, cfg.startLong);
                    const p2 = getPointPosition(cfg.method, cfg.startLat, cfg.startLong);
                    region = {
                        startRow: p1.row,
                        startCol: p1.col,
                        endRow: p2.row,
                        endCol: p2.col
                    };
                }
                else if (cfg.method === 'row&col') {
                    region = {
                        startRow: cfg.startRow,
                        startCol: cfg.startCol,
                        endRow: cfg.endRow,
                        endCol: cfg.endCol
                    }
                }
                return Promise.resolve({
                    type: 'region',
                    cfg: region
                });
            }
            else {
                return Promise.reject('invalid STD data type!');
            }
        })
        .then(requestData)
        .then(response => {
            let fname = response.headers['Content-Disposition'];
            fname = fname.substring(fname.indexOf('filename=') + 9);
            return Promise.resolve({
                length: response.headers['content-length'],
                data: response.body,
                filename: fname
            });
        })
        .catch(Promise.reject);
}

const getPointPosition = (type, x, y): {
    row: number,
    col: number
} => {
    let row, col;
    if (type === 'lat&long') {
        row = ((90 + y) * 2).toFixed(0);
        col = ((x % 360 < 0 ? (x % 360 + 360) : x % 360) * 2).toFixed(0);
    }
    else if (type === 'row&col') {
        row = y;
        col = x;
    }
    else if (type === 'map') {
        [col, row] = proj4('EPSG:4326').forward(x, y);
        row = ((90 + row) * 2).toFixed(0);
        col = ((col % 360 < 0 ? (col % 360 + 360) : col % 360) * 2).toFixed(0);
    }

    return {
        row: row,
        col: col
    };
}

const requestData = (cfg): Promise<any> => {
    // 暂时不管 STD Data 的 type， 假设计算服务器上只存储了这一种标准数据
    const url = `http://${setting.calculation_server.host}:${setting.calculation_server.port}/std-data?type=${cfg.type}`;
    return RequestCtrl.getByServer(url, cfg.cfg, true);
}