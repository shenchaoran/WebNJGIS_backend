// const debug = require('debug')('WebNJGIS: Debug');
import * as iconv from 'iconv-lite'
import * as Promise from 'bluebird';
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const fs = Promise.promisifyAll(require('fs'));
import * as unzip from 'unzip';
import { Buffer } from 'buffer';
import * as _ from 'lodash';
import { solutionDB } from '../models/solution.model';
import * as UDXCtrl from './UDX.visualization.controller';
import { geoDataDB } from '../models/UDX-data.model';
import { ObjectID } from 'mongodb';
import * as RequestCtrl from '../utils/request.utils';
import * as path from 'path';
import { getByServer } from '../utils/request.utils';
import { setting } from '../config/setting';
import * as child_process from 'child_process';
import * as Papa from 'papaparse';
let exec = child_process.exec;

geoDataDB.find({a: 1})
    .then(console.log.bind(null, '1'))
    .catch(console.error);

// let csvPath = path.join(__dirname, '../test/test.csv')
// let csv$ = fs.createReadStream(csvPath, 'utf8')
// Papa.parse(csv$, {
//     complete: parsed => {
//         parsed
//     }
// })
// let data = []
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

// exec('activate base && python ../child-process/test2.py', { 
//     encoding: 'binary',
//     cwd: __dirname
// }, (err, stdout, stderr) => {
//     function toGBK(str) {
//         return iconv.decode(Buffer.from(str, 'binary'), 'cp936')
//     }
//     if (err) {
//         console.log(toGBK(err.message))
//     }
//     if (stderr) {
//         console.log(toGBK(stderr))
//     }
//     if (stdout) {
//         console.log(toGBK(stdout))
//     }
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

// Promise.all([
//     Promise.resolve(1)
//         .then(v => {
//             throw new Error('custom error')
//         })
//         .catch(e => {
//             return Promise.resolve();
//         }),
//         Promise.resolve(2)
// ])
//     .then(rsts => {
//         console.log('map finished');

//     })
//     .catch(e => {
//         console.log('catch by Map')
//     })

// new Promise((resolve, reject) => {
//     resolve();
// })
//     .then(() => {
//         try{
//             throw new Error('custom error')
//             return ;
//         }
//         catch(e) {
//             console.log('catch error');
//             return Promise.resolve();
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
// Promise.map(fileIndex, fname => {
//     console.log(fname);

// }, {
//     concurrency: 10
// })

// new Promise((resolve, reject) => {
//     resolve(1);

// })
//     .then((v) => {
//         console.log(v,2);
//         // return 3;
//         // setTimeout(() => {
//         //     console.log('async');
//         // }, 0);
//         return new Promise((resolve, reject) => {
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
//         console.log(e);

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

// geoDataDB.find({_id: '5a5eef3b5455b4ab888b1257'});


// geoDataDB.findOne({_id: '5a5eef3b5455b4ab888b1257'})
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
//     // Promise.map(data, solutionDB.insert, {concurrency: 5000})
//     //     .then(rsts => {
//     //         console.log(rsts);
//     //     })
//     //     .catch(console.log);
//     console.log('finished!');
// };

// var Promise = require('bluebird');
// const ASYNCS = [];
// for(let i=0;i<100;i++) {
//     ASYNCS.push(i);
// }

// Promise.map(ASYNCS, function (async) {
//     return Promise.resolve(async);
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

// // Promise.all
// Promise.all([
//     new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve(1)
//         }, 1000);
//     }),
//     Promise.resolve(2),
//     Promise.resolve(3)
// ])
//     .then(console.log)
//     .catch(console.log);


// const aPromise = new Promise(function (resolve) {
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


// import * as CmpCtrl from './UDX.compare.controller';
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
