
import { STD_DATA } from './STD_DATA.interface';
import * as  Promise from 'bluebird'; import * as proj4x from 'proj4';
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
    inputPath = setting.STD_DATA.BIOME_BGC_STD_DATA.inputPath;
    outputPath = setting.STD_DATA.BIOME_BGC_STD_DATA.outputPath;
    iniPath = (i) => {
        return path.join(this.inputPath, 'ini', i + '.ini');
    }
    epcPath = () => {
        return path.join(this.inputPath, 'epc', 'shrub.epc');
    }
    riPath = (i) => {
        return path.join(this.inputPath, 'restart', i + '.endpoint');
    }
    roPath = (i) => {
        return path.join(this.inputPath, 'restart', i + '.endpoint');
    }
    metPath = (i) => {
        return path.join(this.inputPath, 'metdata', i + '.mtc43');
    }
    co2Path = () => {
        return path.join(this.inputPath, 'co2', 'co2.txt');
    }
    oPathPreffix = (i) => {
        return path.join(this.outputPath, '' + i);
    }
    iniFname = (i) => {
        return i + '.ini';
    }
    epcFname = () => {
        return 'shrub.epc';
    }
    riFname = (i) => {
        return i + '.endpoint';
    }
    roFname = (i) => {
        return i + '.endpoint';
    }
    metFname = (i) => {
        return i + '.mtc43';
    }
    co2Fname = () => {
        return 'co2.txt';
    }
    oFname = (i) => {
        return i + '.dayout.ascii';
    }

    getExeInvokeStr(stdId: string, msInstance: CalcuTask): Promise<any> {
        let ioStr;
        let std = msInstance.IO.std;
        let coor = parseCoor(std);
        const group = coor.match(/\[(.*),(.*)\]/);
        if (group.length < 3) {
            console.log('invalid coor');
            return Promise.reject('invalid coor');
        }
        return siteDB.findOne({
            x: parseFloat(group[1].trim()),
            y: parseFloat(group[2].trim())
        })
            .then(site => {
                const index = site.index;
                const ioStr = `-a --i=${this.iniPath(index)} --m=${this.metPath(index)} --ri=${this.riPath(index)} --ro=${this.roPath(index)} --co2=${this.co2Path()} --epc=${this.epcPath()} --o=${this.oPathPreffix(index)}`;

                // TODO 这样处理的话，其他类别的标准数据集接入就会出问题，待优化
                const setEventV = (type) => {
                    _.map(msInstance.IO[type] as any[], event => {
                        if (type === 'outputs' && msInstance.IO.dataSrc === 'STD') {
                            event.fname = _.cloneDeep(event.value) + event.ext;
                        }

                        if (msInstance.IO.dataSrc === 'STD') {
                            event.url = `/std-data/${this.name}?eventId=${event.id}&query=${index}`;
                        }
                        else if (msInstance.IO.dataSrc === 'UPLOAD') {
                            event.url = `/data/${event.value}`;
                        }
                        event.value = index;
                    });
                }

                return fs.statAsync(this.oPathPreffix(index))
                    .then(stat => {
                        setEventV('inputs');
                        setEventV('outputs');
                        return Promise.resolve({
                            runned: true
                        });
                    })
                    .catch(e => {
                        if (e.code === 'ENOENT') {
                            setEventV('inputs');
                            setEventV('outputs');
                            return Promise.resolve({
                                runned: false,
                                ioStr: ioStr
                            });
                        }
                        else {
                            return Promise.reject('fs state err: ' + JSON.stringify(e))
                        }
                    });
            });
    }

    downloadData(eventId, query): Promise<any> {
        let fpath, fname;
        switch (eventId) {
            case '--i':
                fname = this.iniFname(query);
                fpath = this.iniPath(query);
                break;
            case '--m':
                fname = this.metFname(query);
                fpath = this.metPath(query);
                break;
            case '--ri':
                fname = this.riFname(query);
                fpath = this.riPath(query);
                break;
            case '--ro':
                fname = this.roFname(query);
                fpath = this.roPath(query);
                break;
            case '--co2':
                fname = this.co2Fname();
                fpath = this.co2Path();
                break;
            case '--epc':
                fname = this.epcFname();
                fpath = this.epcPath();
                break;
            case '--o':
                fname = this.oFname(query);
                fpath = this.oPathPreffix(query) + '.dayout.ascii';
                break;
        }
        return fs.readFileAsync(fpath)
            .then(data => {
                return Promise.resolve({
                    length: data.length,
                    filename: fname,
                    data: data
                });
            })
            .catch(e => {
                console.log(e);
                return Promise.reject('No file found!');
            });
    }
}

const parseCoor = (stdList) => {
    let coorE = _.find(stdList as any[], event => event.id === '-coor' || event.id === '--coordinate');
    return coorE ? coorE.value : undefined;
}