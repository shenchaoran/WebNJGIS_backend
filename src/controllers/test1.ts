import * as Promise from 'bluebird';

import { cmpSolutionDB } from '../models/cmp-solution.model';

export const testFunc = () => {
    const data = [];
    for(let i=0;i< 1000;i++) {
        data.push({
            meta: new Date().getTime(),
            cfg: new Date().getTime()
        });
    }
    // Promise.map(data, cmpSolutionDB.insert, {concurrency: 5000})
    //     .then(rsts => {
    //         console.log(rsts);
    //     })
    //     .catch(console.log);
    console.log('finished!');
}

// const ASYNCS = [];
// for(let i=0;i<100000;i++) {
//     ASYNCS.push(i);
// }

// Promise.map(ASYNCS, function (async) {
//     return Promise.resolve(console.log(async));
// },{concurrency: 5000});