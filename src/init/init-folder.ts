import * as Bluebird from 'bluebird';
const debug = require('debug');
const initDebug = debug('WebNJGIS: Init');
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';

export const initFolders = (): Bluebird<any> => {
    const folders = ['dist/upload', 'dist/upload/geo-data', 'dist/logs'];
    return new Bluebird((resolve, reject) => {
        Bluebird.all(_.map(folders, initFolder))
            .then(rsts => {
                return resolve();
            })
            .catch(error => {
                return reject(error);
            });
    });
};

const initFolder = (fpath: string): Bluebird<any> => {
    return new Bluebird((resolve, reject) => {
        fs.stat(fpath, (err, stats) => {
            if (err) {
                initDebug(err);
                if (err.code === 'ENOENT') {
                    fs.mkdir(fpath, err => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve();
                        }
                    });
                } else {
                    return reject(err);
                }
            } else {
                if (stats.isDirectory()) {
                    return resolve();
                } else {
                    fs.mkdir(fpath, err => {
                        if (err) {
                            initDebug(err);
                            return reject(err);
                        } else {
                            return resolve();
                        }
                    });
                }
            }
        });
    });
};
