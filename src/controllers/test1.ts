import * as Promise from 'bluebird';

const ASYNCS = [];
for(let i=0;i<100000;i++) {
    ASYNCS.push(i);
}

Promise.map(ASYNCS, function (async) {
    return Promise.resolve(console.log(async));
},{concurrency: 5000});