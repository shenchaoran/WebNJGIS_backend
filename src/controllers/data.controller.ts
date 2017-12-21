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
import { geoDataDB, GeoDataClass, STD_DATA } from '../models/UDX-data.model';
import * as APIModel from '../models/api.model';
import * as RequestCtrl from './request.controller';
const debug = require('debug');
const dataDebug = debug('WebNJGIS: Data');
import UDXComparators = require('./UDX.compare.control');
import { UDXCfg } from '../models/UDX-cfg.class';
import { UDXSchema } from '../models/UDX-schema.class';
import { ResourceSrc } from '../models/resource.enum';

export const find = (req: Request, res: Response, next: NextFunction) => {
    geoDataDB
        .find({})
        .then(docs => {
            res.locals.resData = docs;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

// 前端数据资源放在三个tab中，每个tab中的数据按照树状结构显示
export const convert2Tree = (user, docs: Array<any>): Promise<any> => {
    // TODO 树的组织标准未定，暂时都放在《地球碳循环模式》下面。
    const trees = {
        // std: [
        //     {
        //         type: 'root',
        //         label: "Earth's carbon cycle model",
        //         value: undefined,
        //         id: 'aaaaaaaaa',
        //         expanded: true,
        //         items: []
        //     }
        // ],
        public: [
            {
                type: 'root',
                label: "Earth's carbon cycle model",
                value: undefined,
                id: 'bbbbbbbbb',
                expanded: true,
                items: []
            }
        ],
        personal: undefined
    };
    // const stdDocs = _.filter(
    //     docs,
    //     doc => doc.auth.src === ResourceSrc.STANDARD
    // );
    const publicDocs = _.filter(
        docs,
        doc => doc.auth.src === ResourceSrc.PUBLIC
    );
    let personalDocs = undefined;
    if (user && user.username !== 'Tourist') {
        trees.personal = [
            {
                type: 'root',
                label: "Earth's carbon cycle model",
                value: undefined,
                id: 'ccccccccccc',
                expanded: true,
                items: []
            }
        ];
        personalDocs = <Array<any>>_.filter(
            docs,
            doc => doc.auth.userId === user._id
        );
        if (personalDocs) {
            _.map(personalDocs, doc => {
                trees.personal[0].items.push({
                    type: 'leaf',
                    label: (<any>doc).file.name,
                    value: doc,
                    id: (<any>doc)._id
                });
            });
        }
    }
    // _.map(stdDocs, doc => {
    //     trees.std[0].items.push({
    //         type: 'leaf',
    //         label: doc.file.name,
    //         value: doc,
    //         id: doc._id
    //     });
    // });
    _.map(publicDocs, doc => {
        trees.public[0].items.push({
            type: 'leaf',
            label: doc.file.name,
            value: doc,
            id: doc._id
        });
    });

    return Promise.resolve(trees);
};

export const remove = (req: Request, res: Response, next: NextFunction) => {
    if (req.params.id != undefined) {
        geoDataDB
            .remove({ _id: req.params.id })
            .then(docs => {
                res.locals.resData = docs;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    } else {
        return next(new Error("can't find related resource in the database!"));
    }
};

/**
 * 条目保存到数据库，文件移动到upload/geo-data中
 * 如果数据为zip则解压
 */
export const insert = (req: Request, res: Response, next: NextFunction) => {
    const form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = path.join(setting.uploadPath, 'geo-data');
    form.keepExtensions = true;
    form.maxFieldsSize = 500 * 1024 * 1024;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }
        if (files['geo-data']) {
            const file = files['geo-data'];
            const filename = file.name;
            const ext = filename.substr(filename.lastIndexOf('.'));
            const oid = new ObjectID();
            const newName = oid + ext;

            const newPath = path.join(setting.uploadPath, 'geo-data', newName);
            fs.rename(file.path, newPath, err => {
                if (err) {
                    return next(err);
                }
                if (ext === '.zip') {
                    const unzipPath = path.join(
                        setting.uploadPath,
                        'geo-data',
                        oid.toHexString()
                    );
                    const unzipExtractor = unzip.Extract({ path: unzipPath });
                    fs.createReadStream(newPath).pipe(unzipExtractor);
                    unzipExtractor.on('error', err => next(err));
                    unzipExtractor.on('close', () => {
                        const cfgPath = path.join(unzipPath, 'index.json');
                        parseUDXCfg(cfgPath).then(udxcfg => {
                            const newItem = {
                                _id: oid,
                                meta: {
                                    name: filename,
                                    path: newName,
                                    desc: fields.desc
                                },
                                auth: {
                                    userId: fields.userId,
                                    src: fields.src
                                },
                                udxcfg: udxcfg,
                            };
                            geoDataDB
                                .insert(newItem)
                                .then(doc => {
                                    res.locals.resData = {doc: doc};
                                    res.locals.template = {};
                                    res.locals.succeed = true;
                                    return next();
                                })
                                .catch(next);
                        });
                    });
                } else {
                    dataDebug('Upload data type error!');
                    return next(new Error('Upload data type error!'));
                }
            });
        }
    });
};

/**
 * deprecated
 * 从数据库中查询数据，并post到模型服务容器中
 */
export const pushData = (_id: string): Promise<any> => {
    let doc = undefined;
    let url = APIModel.getAPIUrl('upload-geo-data');
    return new Promise((resolve, reject) => {
        geoDataDB
            .find({ _id: _id })
            .then(rsts => {
                if (rsts.length) {
                    doc = rsts[0];
                    url += `?type=file&gd_tag=${doc.tag}`;
                    const fpath = path.join(
                        setting.uploadPath,
                        'geo-data',
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
                    // doc.gdid = response.gd_id;
                    return geoDataDB.update({ _id: _id }, doc);
                } else {
                    return reject(new Error('post to model server failed!'));
                }
            })
            .then(rst => {
                return resolve(doc._id);
            })
            .catch(err => {
                return reject(err);
            });
    });
};

/**
 * deprecated
 * 从模型服务容器中下载模型计算结果数据，并保存到本地服务器中
 */
export const pullData = (output): Promise<any> => {
    let extName = undefined;
    // let dataType: GeoDataType;
    const oid = new ObjectID();
    const oidStr = oid.toHexString();
    const url = APIModel.getAPIUrl('download-geo-data', { id: output.DataId });
    let dataLabel = output.Tag;
    if (dataLabel.indexOf('.') != -1) {
        dataLabel = dataLabel.substring(0, dataLabel.lastIndexOf('.'));
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
                if (extName) {
                    dataLabel += '.' + extName;
                }
                let newName: string = undefined;
                let fdata = undefined;
                // if (extName === 'xml') {
                //     dataType = GeoDataType.UDX;
                //     newName = oidStr + '.xml';
                //     fdata = new Buffer(response.gd_value, 'binary');
                // // } else if (extName === 'zip' || extName === 'txt' || extName === 'csv' || extName === 'xls' || extName === 'xlsx') {
                // } else {
                //     dataType = GeoDataType.RAW;
                newName = oidStr + '.' + extName;
                fdata = new Buffer(response.gd_value, 'binary');
                // }
                const fpath = path.join(
                    setting.uploadPath,
                    'geo-data',
                    newName
                );

                return new Promise((resolve2, reject2) => {
                    fs.writeFile(fpath, fdata, err => {
                        if (err) {
                            return reject2(err);
                        } else {
                            if (extName === 'zip') {
                                const unzipPath = path.join(
                                    setting.uploadPath,
                                    'geo-data',
                                    oidStr
                                );
                                const unzipExtractor = unzip.Extract({
                                    path: unzipPath
                                });
                                fs.createReadStream(fpath).pipe(unzipExtractor);
                                unzipExtractor.on('error', err => {
                                    reject2(err);
                                });
                                unzipExtractor.on('close', () => {
                                    return resolve2();
                                });
                            } else {
                                return resolve2();
                            }
                        }
                    });
                });
            })
            .then(() => {
                const newItem = {
                    _id: oid,
                    // gdid: output.DataId,
                    filename: output.Tag,
                    // tag: output.Tag,
                    // type: dataType,
                    path: oidStr + '.' + extName
                };
                return geoDataDB.insert(newItem);
            })
            .then(doc => {
                if (doc != undefined) {
                    output.DataId = oidStr;
                    output.filename = dataLabel;
                    return resolve(output);
                } else {
                    return reject(new Error('insert into mongodb failed!'));
                }
            })
            .catch(err => reject(err));
    });
};

export const download = (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        geoDataDB
            .find({ _id: id })
            .then(docs => {
                if (docs.length) {
                    const doc = docs[0];
                    const fpath = path.join(
                        setting.uploadPath,
                        'geo-data',
                        doc.path
                    );
                    fs.stat(fpath, (err, stats) => {
                        if (err) {
                            if (err.code === 'ENOENT') {
                                return reject(new Error("can't find data file!"));
                            }
                            return reject(err);
                        } else {
                            fs.readFile(fpath, (err, data) => {
                                if (err) {
                                    return reject(err);
                                } else {
                                    return resolve({
                                        length: data.length,
                                        filename: doc.file.name,
                                        data: data
                                    });
                                }
                            });
                        }
                    });
                } else {
                    return reject(new Error("can't find data file!"));
                }
            })
            .catch(reject);
    });
};

export const visualization = (
    req: Request,
    res: Response,
    next: NextFunction
) => {};

/**
 * deprecated 
 */
export const compareUDX = (req: Request, res: Response, next: NextFunction) => {
    const leftId = req.params.left;
    const rightId = req.params.right;

    Promise.all(
        _.map([leftId, rightId], _id => {
            return new Promise((resolve, reject) => {
                geoDataDB
                    .find({ _id: _id })
                    .then(rsts => {
                        if (rsts.length) {
                            const doc = rsts[0];
                            return Promise.resolve(doc);
                        } else {
                            return next(new Error("can't find data!"));
                        }
                    })
                    .then(parseUDXCfg)
                    .then(resolve)
                    .catch(reject);
            });
        })
    )
        .then(UDXComparators.compare_old)
        .then(rst => {
            res.locals.resData = rst;
            res.locals.template = {};
            res.locals.succeed = true;
            return next();
        })
        .catch(next);
};

export const parseUDXCfg = (cfgPath: string): Promise<UDXCfg> => {
    const folderPath = cfgPath.substring(0, cfgPath.lastIndexOf('index.json'));
    return new Promise((resolve, reject) => {
        fs.readFile(cfgPath, (err, dataBuf) => {
            if (err) {
                return reject(err);
            }
            try {
                // const udxcfg = new UDXCfg();
                const cfgStr = dataBuf.toString();
                const udxcfg = JSON.parse(cfgStr);
                return resolve(udxcfg);
            } catch (e) {
                return reject(e);
            }
        });
    });
};