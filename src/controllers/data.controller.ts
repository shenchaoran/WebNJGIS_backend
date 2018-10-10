import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs_ from 'fs';
import * as unzip from 'unzip';
import { setting } from '../config/setting';
import * as RequestCtrl from '../utils/request.utils';
import * as NodeCtrl from './computing-node.controller'
import { geoDataDB, GeoDataClass, UDXCfg, calcuTaskDB, CalcuTaskState } from '../models';
const fs: any = Bluebird.promisifyAll(fs_)

export default class DataCtrl {
    private afterDataCached: Function = () => {};
    private afterDataBatchCached: Function = () => {};
    constructor(lifeCycles?: {
        afterDataCached?: Function,
        afterDataBatchCached?: Function
    }) {
        Object.assign(this, lifeCycles)
    }

	/**
	 * 条目保存到数据库，文件移动到upload/geo-data中
	 * 如果数据为zip则解压
	 */
    async insert(req: Request, res: Response, next: NextFunction) {
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
                                    this.parseUDXCfg(cfgPath).then(udxcfg => {
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
                                                return res.json({
                                                    data: doc
                                                });
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
                                return res.json({
                                    data: doc
                                });
                            })
                            .catch(next);
                    }
                });
            }
        });
    };

    async download(id: string) {
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
                        return Bluebird.resolve({
                            path: fpath,
                            fname: doc.meta.name
                        })
                    })
                    .catch(e => {
                        return Bluebird.reject(e.code === 'ENOENT' ? 'file don\'t exist!' : 'unpredictable error!');
                    });
            })
            .catch(Bluebird.reject);
    };

    async visualization(req: Request, res: Response, next: NextFunction) { };

    async parseUDXCfg(cfgPath: string) {
        const folderPath = cfgPath.substring(0, cfgPath.lastIndexOf('index.json'));
        return new Bluebird((resolve, reject) => {
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
    async cacheData({ msrId, eventId }) {
        let eventIndex, event, eventType
        let msr = await calcuTaskDB.findOne({ _id: msrId });
        for (let key in msr.IO) {
            if (key === 'inputs' || key === 'outputs') {
                let events = msr.IO[key];
                for (let i = 0; i < events.length; i++) {
                    if (events[i].id === eventId) {
                        eventType = key
                        eventIndex = i
                        event = events[i]
                    }
                }
            }
        }
        console.log(eventType, eventIndex)

        if (event.cached) {
            this.afterDataCached({
                code: 200
            });
            let { path, fname } = await this.download(event.value);
            return Bluebird.resolve({
                stream: fs.createReadStream(path),
                fname: fname
            })
                .catch(e => {
                    console.error(e)
                    return Bluebird.reject(e)
                })
        }
        else {
            let serverURL = await NodeCtrl.telNode(msr.ms.nodeId);
            return RequestCtrl.getFile(`${serverURL}/data/download?msrId=${msrId}&eventId=${eventId}`, setting.geo_data.path, ({ fname, fpath }) => {
                if (msr.state === CalcuTaskState.FINISHED_SUCCEED) {
                    let gdid = new ObjectID();
                    let setObj = {}
                    setObj[`IO.${eventType}.${eventIndex}.value`] = gdid.toHexString()
                    setObj[`IO.${eventType}.${eventIndex}.cached`] = true;
                    Bluebird.all([
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
                        }),
                        calcuTaskDB.update({ _id: msr._id }, {
                            $set: setObj
                        })
                    ])
                        .then(rsts => {
                            this.afterDataCached({
                                code: 200
                            });
                        })
                }
            })
                .catch(e => {
                    console.error(e)
                    this.afterDataCached({
                        code: 500
                    });
                    return Bluebird.reject(e)
                })
        }
    }

    async cacheDataBatch(msrId) {
        let msr = await calcuTaskDB.findOne({ _id: msrId });
        let toPulls = []
        for (let key in msr.IO) {
            if (key === 'inputs' || key === 'outputs') {
                _.map(msr.IO[key] as any[], event => {
                    if (!event.cached) {
                        toPulls.push({
                            msrId: msrId,
                            eventId: event.id
                        })
                    }
                })
            }
        }
        return Bluebird.map(toPulls, toPull => {
            return new Promise((resolve, reject) => {
                new DataCtrl({
                    afterDataCached: ({code}) => {
                        if(code === 500) {
                            console.log('cache data failed: ', toPull)
                            resolve({code})
                        }
                        else {
                            resolve({code})
                        }
                    }
                })
                    .cacheData(toPull)
                    .catch(reject)
            });
        }, {
            concurrency: 1
        })
            .then(rsts => {
                console.log('****** cache data succeed of msr: ' + msrId);
                // 这里暂不管缓存结果，在比较时从 db 里的记录里取缓存结果
                this.afterDataBatchCached({
                    code: 200,
                    desc: 'cache data succeed!'
                });
            })
            .catch(e => {
                this.afterDataBatchCached({
                    code: 500,
                    desc: 'cache data batch failed!'
                });
            })
    }

    /**
     * 如果使用上传数据运行，则需要先将所有数据 post 过去
     */
    async pushData2ComputingServer(msrId) {
        let msr, serverURL
        return new Bluebird((resolve, reject) => {
            calcuTaskDB.findOne({ _id: msrId })
                .then(doc => {
                    msr = doc
                    return NodeCtrl.telNode(msr.ms.nodeId)
                })
                .then(v => {
                    serverURL = v
                    let url = serverURL + '/data'
                    return Bluebird.map(msr.IO.inputs as any[], input => {
                        let fpath = path.join(setting.geo_data.path, input.value + input.ext)
                        return RequestCtrl.postByServer(url, {
                            useNewName: 'false',
                            myfile: fs.createReadStream(fpath)
                        }, RequestCtrl.PostRequestType.File)
                            .then(res => {
                                res = JSON.parse(res)
                                if (res.code === 200) {
                                    return Bluebird.resolve()
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