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
import * as EventEmitter from 'events';
import { GeoDataModel, CalcuTaskModel, CalcuTaskState, ModelServiceModel } from '../models';
const fs: any = Bluebird.promisifyAll(fs_)

export default class DataCtrl extends EventEmitter {
    constructor() {
        super();
    }

	/**
	 * 条目保存到数据库，文件移动到upload/geo-data中
	 * 如果数据为zip则解压
	 */
    async insert(fields, files) {
        try {
            if (files['geo-data']) {
                const file = files['geo-data'];
                const filename = file.name;
                const ext = filename.substr(filename.lastIndexOf('.'));
                const oid = new ObjectID();
                const newName = oid + ext;

                const newPath = path.join(setting.geo_data.path, newName);
                await fs.renameAsync(file.path, newPath);
                if (ext === '.zip') {
                    const unzipPath = path.join(setting.geo_data.path, oid.toHexString());
                    return new Bluebird((resolve, reject) => {
                        fs.createReadStream(newPath)
                            .pipe(unzip.Extract({ path: unzipPath }))
                            .on('error', reject)
                            .on('close', () => {
                                const cfgPath = path.join(unzipPath, 'index.json');
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
                                    GeoDataModel.insert(newItem).then(resolve);
                                });
                            });
                    })
                }
                else {
                    return GeoDataModel.insert({
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
                }
            }
        }
        catch (e) {
            console.log(e)
            return Bluebird.reject(e);
        }
    };

    async download(id: string) {
        try {
            let doc = await GeoDataModel.findOne({ _id: id })
            let fpath = path.join(setting.geo_data.path, doc.meta.path);
            let stats = await fs.statAsync(fpath)
            return { fpath, fname: doc.meta.name }
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e.code === 'ENOENT' ? 'file don\'t exist!' : 'unpredictable error!');
        }
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
        try {
            let eventIndex, event, eventType
            let msr = await CalcuTaskModel.findOne({ _id: msrId });
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
            // console.log(eventType, eventIndex)

            if (event.cached) {
                this.emit('afterDataCached', { code: 200 })
                let { fpath, fname } = await this.download(event.value);
                let stream = fs.createReadStream(fpath);
                return { stream, fname };
            }
            else {
                let ms = await ModelServiceModel.findOne({ _id: msr.msId });
                let serverURL = await NodeCtrl.telNode(msr.nodeId);
                let fetchEvent = await RequestCtrl.getFile(`${serverURL}/data/download?msrId=${msrId}&eventId=${eventId}`, setting.geo_data.path)
                fetchEvent.on('afterWrite', ({ fname, fpath }) => {
                    if (msr.state === CalcuTaskState.FINISHED_SUCCEED) {
                        let gdid = new ObjectID();
                        let setObj = {
                            [`IO.${eventType}.${eventIndex}.value`]: gdid.toHexString(),
                            [`IO.${eventType}.${eventIndex}.cached`]: true
                        }
                        Bluebird.all([
                            GeoDataModel.insert({
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
                            CalcuTaskModel.updateOne({ _id: msr._id }, {
                                $set: setObj
                            })
                        ])
                            .then(rsts => {
                                this.emit('afterDataCached', { code: 200 });
                            })
                    }
                })
                return new Bluebird((resolve, reject) => {
                    fetchEvent.on('response', resolve)
                })
            }
        }
        catch (e) {
            console.error(e)
            this.emit('afterDataCached', { code: 500 });
            return Bluebird.reject(e)
        }
    }

    async cacheDataBatch(msrId) {
        let msr = await CalcuTaskModel.findOne({ _id: msrId });
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
            return new Bluebird((resolve, reject) => {
                let dataCtrl = new DataCtrl()
                dataCtrl.on('afterDataCached', resolve)
                dataCtrl.cacheData(toPull)
            });
        }, {
                concurrency: 1
            })
            .then(rsts => {
                console.log('****** cache data succeed of msr: ' + msrId);
                // 这里暂不管缓存结果，在比较时从 db 里的记录里取缓存结果
                this.emit('afterDataBatchCached', {
                    code: 200,
                    desc: 'cache data succeed!'
                });
            })
            .catch(e => {
                this.emit('afterDataBatchCached', {
                    code: 500,
                    desc: 'cache data batch failed!'
                });
            })
    }

    /**
     * 如果使用上传数据运行，则需要先将所有数据 post 过去
     */
    async pushData2ComputingServer(msrId) {
        try {
            let msr = await CalcuTaskModel.findOne({ _id: msrId });
            let ms = await ModelServiceModel.findOne({ _id: msr.msId });
            let serverURL = await NodeCtrl.telNode(msr.nodeId);
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
                });
        }
        catch (e) {
            console.log(e);
            return Bluebird.reject(e);
        }
    }
}