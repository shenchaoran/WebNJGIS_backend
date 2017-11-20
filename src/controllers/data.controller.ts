import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
import * as unzip from 'unzip';

import { setting } from '../config/setting';
import {
    DataModelInstance,
    GeoDataType,
    GeoDataClass
} from '../models/data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
import * as UDXParser from './UDX.parser.controller';
const dataDebug = debug('WebNJGIS: Data');
import UDXComparer = require('./UDX.compare.control');

/**
 * 条目保存到数据库，文件移动到upload/geo_data中
 * 如果数据为zip则解压
 * 
 * @param req
 * @param res 
 * @param next 
 */
export const uploadFiles = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = path.join(setting.uploadPath, 'geo_data');
    form.keepExtensions = true;
    form.maxFieldsSize = 500 * 1024 * 1024;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }
        if (files.geo_data) {
            const file = files.geo_data;
            const filename = file.name;
            const ext = filename.substr(filename.lastIndexOf('.'));
            const oid = new ObjectID();
            const newName = oid + ext;

            const newPath = path.join(setting.uploadPath, 'geo_data', newName);
            fs.rename(file.path, newPath, err => {
                if (err) {
                    return next(err);
                }
                const insertItem = () => {
                    const newItem = {
                        _id: oid,
                        gdid: undefined,
                        filename: filename,
                        tag: fields.tag,
                        type: fields.type,
                        path: newName
                    };
                    DataModelInstance.insert(newItem)
                        .then(doc => {
                            res.locals.resData = {
                                _id: oid.toHexString(),
                                gdid: undefined,
                                filename: filename,
                                tag: fields.tag,
                                type: fields.type,
                                path: newName
                            };
                            res.locals.template = undefined;
                            res.locals.succeed = true;
                            return next();
                        })
                        .catch(next);
                };
                if (ext === '.zip') {
                    const unzipPath = path.join(
                        setting.uploadPath,
                        'geo_data',
                        oid.toHexString()
                    );
                    const unzipExtractor = unzip.Extract({ path: unzipPath });
                    fs.createReadStream(newPath).pipe(unzipExtractor);
                    unzipExtractor.on('error', err => next(err));
                    unzipExtractor.on('close', () => {
                        insertItem();
                    });
                } 
                // else if (
                //     ext === '.xml' ||
                //     ext === '.txt' ||
                //     ext === '.csv' ||
                //     ext === '.xls' ||
                //     ext === '.xlsx'
                // ) {
                else {
                    insertItem();
                }
            });
        }
    });
};

/**
 * deprecated
 * 
 * @param req 
 * @param res 
 * @param next 
 */
export const post2Server = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const geoData = res.locals.resData;
    const fpath = path.join(setting.uploadPath, 'geo_data', geoData.path);
    let url = APIModel.getAPIUrl('upload-geo-data');
    url += `?type=file&gd_tag=${geoData.tag}`;
    const form = {
        myfile: fs.createReadStream(fpath)
    };
    RequestCtrl.postByServer(url, form, RequestCtrl.PostRequestType.File)
        .then(response => {
            response = JSON.parse(response);
            if (response.res === 'suc') {
                geoData.gdid = response.gd_id;
                const newName =
                    geoData.gdid + fpath.substr(fpath.lastIndexOf('.'));
                const newPath = path.join(
                    setting.uploadPath,
                    'geo_data',
                    newName
                );
                DataModelInstance.insert({
                    gdid: geoData.gdid,
                    filename: geoData.filename,
                    path: newName,
                    type: geoData.type,
                    tag: geoData.tag
                })
                    .then(rst => {
                        fs.rename(fpath, newPath, () => {
                            res.locals.resData = geoData;
                            res.locals.template = {};
                            res.locals.succeed = true;
                            return next();
                        });
                    })
                    .catch(next);
            } else {
                const err: any = new Error('post into server failed!');
                err.code = '500';
                return next(err);
            }
        })
        .catch(err => {
            return next(err);
        });
};

/**
 * 从数据库中查询数据，并post到模型服务容器中
 * 
 * @param _id 
 */
export const pushData = (_id: string): Promise<any> => {
    let doc = undefined;
    let url = APIModel.getAPIUrl('upload-geo-data');
    return new Promise((resolve, reject) => {
        DataModelInstance.find({ _id: _id })
            .then(rsts => {
                if (rsts.length) {
                    doc = rsts[0];
                    url += `?type=file&gd_tag=${doc.tag}`;
                    const fpath = path.join(
                        setting.uploadPath,
                        'geo_data',
                        doc.path
                    );
                    const form = {
                        myfile: fs.createReadStream(fpath)
                    };
                    return RequestCtrl.postByServer(
                        url,
                        form,
                        RequestCtrl.PostRequestType.File
                    );
                } else {
                    return reject(new Error("can't find data"));
                }
            })
            .then(response => {
                response = JSON.parse(response);
                if (response.res === 'suc') {
                    doc.gdid = response.gd_id;
                    return DataModelInstance.update({ _id: _id }, doc);
                } else {
                    return reject(new Error('post to model server failed!'));
                }
            })
            .then(rst => {
                return resolve(doc.gdid);
            })
            .catch(err => {
                return reject(err);
            });
    });
};

/**
 * 从模型服务容器中下载模型计算结果数据，并保存到本地服务器中
 * @param output 
 */
export const pullData = (output): Promise<any> => {
    let extName = undefined;
    let dataType: GeoDataType;
    const oid = new ObjectID();
    const oidStr = oid.toHexString();
    const url = APIModel.getAPIUrl('download-geo-data', { id: output.DataId });
    let dataLabel = output.Tag;
    if(dataLabel.indexOf('.') != -1) {
        dataLabel = dataLabel.substring(0,dataLabel.lastIndexOf('.'));
    }

    return new Promise((resolve, reject) => {
        RequestCtrl.getByServer(url, undefined)
            .then(response => {
                response = JSON.parse(response);
                // const resHeaders = response.headers;
                // const hName = resHeaders['content-disposition'];
                // const fName = hName.substr(hName.indexOf('filename=') + 9);
                const fName = response.gd_fname;
                extName = fName.substr(fName.indexOf('.') + 1);
                if(extName) {
                    dataLabel += '.' + extName;
                }
                let newName: string = undefined;
                let fdata = undefined;
                if (extName === 'xml') {
                    dataType = GeoDataType.UDX;
                    newName = oidStr + '.xml';
                    fdata = new Buffer(response.gd_value, 'binary');
                // } else if (extName === 'zip' || extName === 'txt' || extName === 'csv' || extName === 'xls' || extName === 'xlsx') {
                } else {
                    dataType = GeoDataType.RAW;
                    newName = oidStr + '.' + extName;
                    fdata = new Buffer(response.gd_value, 'binary');
                }
                const fpath = path.join(setting.uploadPath, 'geo_data', newName);

                return new Promise((resolve2, reject2) => {
                    fs.writeFile(fpath, fdata, (err) => {
                        if(err) {
                            return reject2(err);
                        }
                        else {
                            if(extName === 'zip') {
                                const unzipPath = path.join(
                                    setting.uploadPath,
                                    'geo_data',
                                    oidStr
                                );
                                const unzipExtractor = unzip.Extract({ path: unzipPath });
                                fs.createReadStream(fpath).pipe(unzipExtractor);
                                unzipExtractor.on('error', err => {
                                    reject2(err)
                                });
                                unzipExtractor.on('close', () => {
                                    return resolve2();
                                });
                            }
                            else {
                                return resolve2();
                            }
                        }
                    })
                });
            })
            .then(() => {
                const newItem = {
                    _id: oid,
                    gdid: output.DataId,
                    filename: output.Tag,
                    tag: output.Tag,
                    type: dataType,
                    path: oidStr + '.' + extName
                };
                return DataModelInstance.insert(newItem);
            })
            .then(doc => {
                if (doc != undefined) {
                    output.DataId = oidStr;
                    output.filename = dataLabel;
                    return resolve(output);
                }
                else {
                    return reject(new Error('insert into mongodb failed!'));
                }
            })
            .catch(err => reject(err));
    });
};

/**
 * 从本地数据库查找数据位置，并返回数据内容
 * 
 * @param req 
 * @param res 
 * @param next 
 */
export const downloadData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    dataDebug(req.params);
    DataModelInstance.find({ _id: req.params.id })
        .then(gd => {
            if (gd.length) {
                gd = gd[0];
                const fpath = path.join(
                    setting.uploadPath,
                    'geo_data',
                    gd.path
                );
                fs.stat(fpath, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            return next(new Error("can't find data file!"));
                        }
                        return next(err);
                    } else {
                        fs.readFile(fpath, (err, data) => {
                            if (err) {
                                return next(err);
                            } else {
                                res.set({
                                    'Content-Type': 'file/*',
                                    'Content-Length': data.length,
                                    'Content-Disposition':
                                        'attachment;filename=' +
                                        encodeURIComponent(req.query.filename)
                                });
                                return res.end(data);
                            }
                        });
                    }
                });
            } else {
                return next(new Error("can't find data file!"));
            }
        })
        .catch(next);
};

export const visualization = (
    req: Request,
    res: Response,
    next: NextFunction
) => {};

export const compareUDX = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const leftId = req.params.left;
    const rightId = req.params.right;

    Promise.all(_.map([leftId, rightId], _id => {
        return new Promise((resolve, reject) => {
            DataModelInstance.find({_id: _id})
                .then(rsts => {
                    if (rsts.length) {
                        const doc = rsts[0];
                        return Promise.resolve(doc);
                    } else {
                        return next(new Error("can't find data!"));
                    }
                })
                .then(UDXParser.parseUDXType)
                .then(resolve)
                .catch(reject);
        })
    }))
        .then(UDXComparer.compare)
        .then(rst => {
            res.locals.resData = rst;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};
