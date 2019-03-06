// const debug = require('debug')('WebNJGIS: Debug');
import * as iconv from 'iconv-lite'
import * as Bluebird from 'bluebird';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const fs = Bluebird.promisifyAll(require('fs'));
import { Document, Schema, Model, model } from 'mongoose';
import * as unzip from 'unzip';
import { Buffer } from 'buffer';
import * as _ from 'lodash';
import { UserModel, TaskModel, CalcuTaskModel, SolutionModel, GeoDataModel, ModelServiceModel, ObsSiteModel, SchemaModel } from '../models';
import { ObjectID } from 'mongodb';
import * as RequestCtrl from '../utils/request.utils';
import * as path from 'path';
import { getByServer } from '../utils/request.utils';
import { setting } from '../config/setting';
import * as child_process from 'child_process';
import * as Papa from 'papaparse';
import CmpTaskCtrl from './task.controller'
require('./cmp-methods')

let batchCmpSite = async () => {
    await Bluebird.all([
        (process as any).schemas = await SchemaModel.find({}),
        (process as any).administrator = await UserModel.findOne({username: 'SCR'}),
    ])
    
    const taskCtrl = new CmpTaskCtrl()
    // ms: IBIS, Biome-BGC, LPJ, MOD17A3 obs: FLUXNET2015
    // cmpMethods: scatter, line, box, taylor, se
    const slnId = '5c41ebb329c7d5df0a000053';   
    
    // ms: IBIS, Biome-BGC LPJ; no obs
    // const slnId = '5c7f7ae890c1497f4f000003'
    
    let sites = await ObsSiteModel.find({index: {$ne: null}})

    // await taskCtrl.startByIndex(22641, slnId)

    await Bluebird.map(sites, site => {
        return new Bluebird((resolve, reject) => {
            taskCtrl.startByIndex(site.index, slnId)
                .then(() => {
                    console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${site.index}: finished`)
                    resolve()
                })
        })
    }, {
        concurrency: 5
    })
}

let removeDocs = async () => {
    return Bluebird.all([
        TaskModel.deleteMany({'meta.desc': 'auto-create by admin for batch test, GPP, 8 day interval'}),
        CalcuTaskModel.deleteMany({'meta.desc': 'auto-create by admin for batch test, GPP, 8 day interval'}),
    ])
}

let main = async () => {
    await removeDocs()
    console.log('-----had removed batch-created docs')
    await batchCmpSite()
    console.log('get all sites succeed')
}
main()


// import SubHeatMap from './cmp-methods/sub-region-heat-map';

// (process as any).on('custom', msg => {
//     console.log(msg)
// })
// (process as any).emit('custom', 'custom event')

// let cp = child_process.spawn('ls', ['-lh', '/usr'])
// cp.stdout.on('data', data => {
//     console.log(data.toString())
// })
// cp.stderr.on('data', data => {
//     console.log(data.toString())
// })
// cp.on('close', code => {
//     console.log(code)
// })



// import Draw, {createBox} from '../test/module.test';
// import * as Draw from '../test/module.test';
// console.log(Draw.default(), Draw.createBox())

// let cp = child_process.spawn('conda', ['activate base'])
// cp.stdout.on('data', data => {
//     console.log(data.toString());
// });
// cp.stderr.on('data', data => {
//     console.error(data.toString());
// })
// cp.on('close', async code => {
//     console.log(code)
// })

// child_process.exec('sh conda activate base', (err, stdout, stderr) => {
//     function toGBK(str) {
//         return iconv.decode(Buffer.from(str, 'binary'), 'cp936')
//     }
//     if (err) {
//         console.log(toGBK(err.message))
//     }
//     if (stderr) {
//         console.error(toGBK(stderr))
//     }
//     if (stdout) {
//         console.log(toGBK(stdout))
//     }
// })

// let heatMapCmp = new SubHeatMap()
// heatMapCmp.start()

// setTimeout(() => {
//     ModelServiceModel.find({})
//         .then(docs => {
//             docs
//         })
//         .catch(e => {
//             console.error(e)
//         })
// }, 1000);

// let exec = child_process.exec;

// SolutionModel.find({}).then(docs => {
//     Bluebird.map(docs as any[], doc => {
//         return SolutionModel.updateOne({_id: doc._id}, {
//             $set: {
//                 msIds: doc.participants.map(v => v._id)
//             }
//         })
//     })
//     .catch(e => {
//         console.error(e);
//     })
// })


// GeoDataModel.find({a: 1})
//     .then(console.log.bind(null, '1'))
//     .catch(console.error);

// let csv$ = fs.createReadStream('F:/geomodelling/model_comparison_backend/dist/upload/geo-data/5bed657db97eab6e405465b4.txt', 'utf8')
// csv$.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, {
//     header: false,
//     dynamicTyping: true,
//     skipEmptyLines: true,
// }))
//     .on('data', item => {
//         item;
//     })
//     .on('end', () => {

//     })

// let read$ = fs.createReadStream(path.join(__dirname, './data.controller.js'))
// let write$1 = fs.createWriteStream(path.join(__dirname, './pipe1.js'))
// let write$2 = fs.createWriteStream(path.join(__dirname, './pipe2.js'))
// read$.pipe(write$1)
// read$.pipe(write$2)
// read$.on('end', chunk => {
//     console.log('end')
// })

// console.log(process)

// let os = require('os')

// let interfaces = os.networkInterfaces()
// for(let key in interfaces) {
//     for(let item of interfaces[key]) {
//         if(!item.internal && item.family === 'IPv4') {
//             (global as any).ipv4 = item.address
//             console.log(item.address)

//             // return resolve()
//         }
//     }
// }

// let pingURL = `http://192.168.79.132:6868/`;
// getByServer(pingURL, undefined)
//     .then(res => {
//         res;
//     })

// Bluebird.all([
//     Bluebird.resolve(1)
//         .then(v => {
//             throw new Error('custom error')
//         })
//         .catch(e => {
//             return Bluebird.resolve();
//         }),
//         Bluebird.resolve(2)
// ])
//     .then(rsts => {
//         console.log('map finished');

//     })
//     .catch(e => {
//         console.log('catch by Map')
//     })

// new Bluebird((resolve, reject) => {
//     resolve();
// })
//     .then(() => {
//         try{
//             throw new Error('custom error')
//             return ;
//         }
//         catch(e) {
//             console.log('catch error');
//             return Bluebird.resolve();
//         } 
//     })
//     .then(() => {
//         console.log('promise then');

//     })
//     .catch(e => {
//         console.log('promise catch');

//     });

// let fpath = path.join(__dirname, '111.txt');
// fs.writeFileAsync(fpath, 'asdf;j\nasdf\r\nasdf')
//     .then(() => {
//         console.log('finished');

//     })
//     .catch(console.log);

// let fileIndex = [];
// for(let i=1; i< 100; i++) {
//     fileIndex.push(i + '.ini');
//     fileIndex.push(i + '_spinup.ini');
// }
// Bluebird.map(fileIndex, fname => {
//     console.log(fname);

// }, {
//     concurrency: 10
// })

// new Bluebird((resolve, reject) => {
//     resolve(1);

// })
//     .then((v) => {
//         console.log(v,2);
//         // return 3;
//         // setTimeout(() => {
//         //     console.log('async');
//         // }, 0);
//         return new Bluebird((resolve, reject) => {
//             console.log('async')
//             return resolve();
//         });
//     })
//     .then(v => {
//         return console.log(v);
//     })
//     .then(v => {
//         console.log(v);

//     })
//     .catch(e => {
//         console.error(e);

//     });

// console.log(new ObjectID('5abc554b79d20cef9d610d7d').toHexString());

// RequestCtrl.postByServer('...', {
//     myfile: fs.createReadStream...postByServer
//     ...: 
// }, "FILE", true)

// RequestCtrl.getByServer('http://localhost:9999/data/5aac7240efa958648898b87e', undefined, true)
//     .then(rst => {
//         console.log(rst);
//     })
//     .catch(console.log);

// GeoDataModel.find({_id: '5a5eef3b5455b4ab888b1257'});


// GeoDataModel.findOne({_id: '5a5eef3b5455b4ab888b1257'})
//     .then(UDXCtrl.showRAWAsciiBatch)
//     .catch(console.log);

// const xml = "asdfasf"
// const doc = new dom().parseFromString(xml)
// const nodes = xpath.select("//title", doc)
// console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
// console.log("Node: " + nodes[0].toString())

// const fpath = 'F:\\geomodelling\\webNJGIS_backend_ts\\dist\\upload\\geo-data\\5a0abb3cfaa10b56b4eb598d.zip';
// const fpath2 = 'F:\\geomodelling\\webNJGIS_backend_ts\\dist\\upload\\geo-data\\5a0abb3cfaa10b56b4eb598d_2.zip';

// const unzipPath = 'F:\\geomodelling\\webNJGIS_backend_ts\\dist\\upload\\geo-data\\5a0abb3cfaa10b56b4eb598d_2';
// fs.readFile(fpath, (err, buf) => {
//     const strbuf = buf.toString();
//     console.log(strbuf);
//     const newBuf = new Buffer(strbuf);
//     fs.writeFile(fpath2, strbuf, {encoding: 'utf8'}, err => {
//         if(err) {
//             console.log(err);
//         }
//         else {
//             const unzipExtractor = unzip.Extract({ path: unzipPath });
//             fs.createReadStream(fpath2).pipe(unzipExtractor);
//             unzipExtractor.on('error', err => {
//                 console.log(err);
//             });
//             unzipExtractor.on('close', () => {
//                 console.log('closed');
//             });
//         }
//     });
// });




// export const testFunc = () => {
//     const data = [];
//     for (let i = 0; i < 1000; i++) {
//         data.push({
//             meta: new Date().getTime(),
//             cfg: new Date().getTime()
//         });
//     }
//     // Bluebird.map(data, SolutionModel.insert, {concurrency: 5000})
//     //     .then(rsts => {
//     //         console.log(rsts);
//     //     })
//     //     .catch(console.log);
//     console.log('finished!');
// };

// var Bluebird = require('bluebird');
// const ASYNCS = [];
// for(let i=0;i<100;i++) {
//     ASYNCS.push(i);
// }

// Bluebird.map(ASYNCS, function (async) {
//     return Bluebird.resolve(async);
// },{concurrency: 20})
//     .then(rsts => {
//         console.log(rsts);
//     });

// const a = {
//     a: 1
// };

// const b = {
//     b: 1
// };

// const c = {
//     a: 2
// };
// let d = {};
// d = {
//     ...a,
//     ...d
// };
// d = {
//     ...b,
//     ...d
// };
// console.log({
//     ...c,
//     ...d
// });

// ////////////////////////////// proj4 test
// const proj4 = require('proj4');
// console.log(proj4('EPSG:3857').forward([0, 77]));
// console.log(proj4('EPSG:3857').forward([180, 77]));
// console.log(proj4('EPSG:3857').inverse([180, 100000000]));
// //////////////////////////////

////////////////////////////// canvas test
// const Canvas = require('canvas');
// const canvas = new Canvas(200, 200);
// const ctx = canvas.getContext('2d');
//////////////////////////////

// 
// enum SchemaName {
//     TABLE_RAW = 'TABLE_RAW',
//     SHAPEFILE_RAW = 'SHAPEFILE_RAW',
//     ASCII_GRID_RAW = 'ASCII_GRID_RAW',
//     ASCII_GRID_RAW_BATCH = 'ASCII_GRID_RAW_BATCH'
// }

// _.forIn(SchemaName, (v, k) => {
//     console.log(k);
// });
// //

// // Bluebird.all
// Bluebird.all([
//     new Bluebird((resolve, reject) => {
//         setTimeout(() => {
//             resolve(1)
//         }, 1000);
//     }),
//     Bluebird.resolve(2),
//     Bluebird.resolve(3)
// ])
//     .then(console.log)
//     .catch(console.log);


// const aPromise = new Bluebird(function (resolve) {
//     resolve(100);
// });
// aPromise.then((value) => {
//     return (value as number) * 2;
// });
// aPromise.then((value) => {
//     return 2*(value as number);
// });
// aPromise.then(function (value) {
//     console.log("1: " + value); // => 100
// });

// const crypto = require('crypto');
// const md5 = (v) => {
//     return crypto.createHash('md5').update(v, 'utf8').digest('hex');
// };

// console.log(md5('23'), md5('23ewgfgsdfaafdfdasf'));


// 测试table chart statistic
// CmpCtrl.compare('5ab100790579a0bcccc60c28', ['TABLE_CHART', 'TABLE_STATISTIC'], 'aycsoi*1000')
//     .then(rst=> {
//         console.log(rst);
//     })
//     .catch(console.log); 

// 测试grid image
// CmpCtrl.compare('5ab3a6ef5f46f2a2ac0566e2', ['ASCII_GRID_BATCH_VISUALIZATION'])
//     .then(rst => {
//         console.log(rst);
//     })
//     .catch(console.log);
