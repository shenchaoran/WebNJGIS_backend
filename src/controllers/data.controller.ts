import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs_ from 'fs';
import * as unzip from 'unzip';
import { setting } from '../config/setting';
import * as RequestCtrl from '../utils/request.utils';
import * as NodeCtrl from './computing-node.controller'
import { geoDataDB, GeoDataClass, STD_DATA, UDXCfg, calcuTaskDB } from '../models';
const fs: any = Promise.promisifyAll(fs_)

export default class DataCtrl {
    constructor() { }

	/**
	 * 条目保存到数据库，文件移动到upload/geo-data中
	 * 如果数据为zip则解压
	 */
    static insert = (req: Request, res: Response, next: NextFunction) => {
        const form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = setting.geo_data.path;
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

                const newPath = path.join(
                    setting.geo_data.path,
                    newName
                );
                fs.rename(file.path, newPath, err => {
                    if (err) {
                        return next(err);
                    }
                    if (ext === '.zip') {
                        const unzipPath = path.join(
                            setting.geo_data.path,
                            oid.toHexString()
                        );
                        try {
                            // console.log(newPath);
                            // console.log(unzipPath);
                            fs
                                .createReadStream(newPath)
                                .pipe(unzip.Extract({ path: unzipPath }))
                                .on('error', err => next(err))
                                .on('close', () => {
                                    // TODO 为什么这里会崩？？？
                                    const cfgPath = path.join(
                                        unzipPath,
                                        'index.json'
                                    );
                                    DataCtrl.parseUDXCfg(cfgPath).then(udxcfg => {
                                        const newItem = {
                                            _id: oid,
                                            meta: {
                                                name: filename,
                                                path: oid.toHexString() + ext,
                                                desc: fields.desc
                                            },
                                            auth: {
                                                userId: fields.userId,
                                                src: fields.src
                                            },
                                            udxcfg: udxcfg
                                        };
                                        geoDataDB
                                            .insert(newItem)
                                            .then(doc => {
                                                // console.log(doc);
                                                res.locals.resData = doc;
                                                res.locals.succeed = true;
                                                return next();
                                            })
                                            .catch(next);
                                    });
                                });
                        } catch (e) {
                            console.log(e);
                            return next(e);
                        }
                    } else {
                        geoDataDB
                            .insert({
                                _id: oid,
                                meta: {
                                    name: filename,
                                    path: oid.toHexString() + ext,
                                    desc: fields.desc
                                },
                                auth: {
                                    userId: fields.userId,
                                    src: fields.src
                                },
                                udxcfg: undefined
                            })
                            .then(doc => {
                                // console.log(doc);
                                res.locals.resData = doc;
                                res.locals.succeed = true;
                                return next();
                            })
                            .catch(next);
                    }
                });
            }
        });
    };

    static download = (id: string): Promise<any> => {
        return geoDataDB.findOne({
            _id: id
        })
            .then(doc => {
                let fpath = path.join(
                    setting.geo_data.path,
                    doc.meta.path,
                );
                return fs.statAsync(fpath)
                    .then(stats => {
                        return Promise.resolve({
                            path: fpath,
                            fname: doc.meta.name
                        })
                    })
                    .catch(e => {
                        return Promise.reject(e.code === 'ENOENT' ? 'file don\'t exist!' : 'unpredictable error!');
                    });
            })
            .catch(Promise.reject);
    };

    static visualization = (req: Request, res: Response, next: NextFunction) => { };

    static parseUDXCfg = (cfgPath: string): Promise<UDXCfg> => {
        const folderPath = cfgPath.substring(
            0,
            cfgPath.lastIndexOf('index.json')
        );
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

    /**
     * resolve {stream, fname}
     * 
     * 如果文件有本地缓存，直接返回给前台
     * 否则文件缓存到本地，同时更新 geodata, calcu task 数据库，并返回给前台
     */
    static cacheData = ({ msrId, eventId }) => {
        let msr, eventIndex, event, eventType
        return calcuTaskDB.findOne({ _id: msrId })
            .then(doc => {
                msr = doc
                // let event = _
                //     .chain(msr.IO)
                //     .values()
                //     .flatten()
                //     .find(v => (v as any).id === eventId)
                //     .value()
                function indexOfEvent(type) {
                    let events = msr.IO[type]
                    if (!events || !events.length)
                        return
                    for (let i = 0; i < events.length; i++) {
                        if (events[i].id === eventId) {
                            eventType = type
                            eventIndex = i
                            event = events[i]
                        }
                    }
                }
                indexOfEvent('inputs')
                indexOfEvent('parameters')
                indexOfEvent('outputs')

                if (event.cached) {
                    return DataCtrl.download(event.value)
                        .then(({ path, fname }) => {
                            return Promise.resolve({
                                stream: fs.createReadStream(path),
                                fname: fname
                            })
                        })
                        .catch(e => {
                            console.error(e)
                            return Promise.reject(e)
                        })
                }
                else {
                    return NodeCtrl.telNode(msr.ms.nodeId)
                        .then(serverURL => {
                            return RequestCtrl.getFile(`${serverURL}/data/download?msrId=${msrId}&eventId=${eventId}`, setting.geo_data.path, ({ fname, fpath }) => {
                                if(msr.progress === 100) {
                                    let gdid = new ObjectID()
                                    geoDataDB.insert({
                                        _id: gdid,
                                        meta: {
                                            desc: '',
                                            path: fpath,
                                            name: fname
                                        },
                                        auth: {
                                            src: _.get(msr, 'auth.src'),
                                            userId: _.get(msr, 'auth.userId')
                                        }
                                    })
    
                                    let setObj = {}
                                    setObj[`IO.${eventType}.${eventIndex}.value`] = gdid.toHexString()
                                    setObj[`IO.${eventType}.${eventIndex}.cached`] = true
                                    calcuTaskDB.update({ _id: msr._id }, {
                                        $set: setObj
                                    })
                                }
                            })
                        })
                        .catch(e => {
                            console.error(e)
                            return Promise.reject(e)
                        })
                }
            })
    }

    static cacheDataBatch = msrId => {
        calcuTaskDB.findOne({_id: msrId})
            .then(msr => {
                let toPulls = []
                for(let key in msr.IO) {
                    if(key === 'inputs' || key === 'outputs') {
                        _.map(msr.IO[key] as any[], event => {
                            if(!event.cached) {
                                toPulls.push({
                                    msrId: msrId,
                                    eventId: event.id
                                })
                            }
                        })
                    }
                }
                return Promise.map(toPulls, DataCtrl.cacheData, {
                    concurrency: 5
                })
            })
            .then(rsts => {
                console.log('****** cache data succeed of msr: ' + msrId)
            })

        return Promise.resolve({
            code: 200
        })
    }

    /**
     * 如果使用上传数据运行，则需要先将所有数据 post 过去
     */
    static pushData2ComputingServer = (msrId) => {
        let msr, serverURL
        return new Promise((resolve, reject) => {
            calcuTaskDB.findOne({ _id: msrId })
                .then(doc => {
                    msr = doc
                    return NodeCtrl.telNode(msr.ms.nodeId)
                })
                .then(v => {
                    serverURL = v
                    let url = serverURL + '/data'
                    return Promise.map(msr.IO.inputs as any[], input => {
                        let fpath = path.join(setting.geo_data.path, input.value + input.ext)
                        return RequestCtrl.postByServer(url, {
                            useNewName: 'false',
                            myfile: fs.createReadStream(fpath)
                        }, RequestCtrl.PostRequestType.File)
                            .then(res => {
                                res = JSON.parse(res)
                                if (res.code === 200) {
                                    return Promise.resolve()
                                }
                                else {
                                    throw 'transfer input file into computing server failed'
                                }
                            })
                            .catch(e => {
                                console.error(e)
                                throw 'transfer input file into computing server failed'
                            })
                    }, {
                            concurrency: 10
                        })
                })
                .then(rsts => {
                    return resolve()
                })
                .catch(e => {
                    return reject(e)
                })
        });
    }
}