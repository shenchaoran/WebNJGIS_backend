// const debug = require('debug')('WebNJGIS: Debug');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const fs = require('fs');
import * as unzip from 'unzip';
import { Buffer } from 'buffer';

// const xml = "asdfasf"
// const doc = new dom().parseFromString(xml)
// const nodes = xpath.select("//title", doc)
// console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
// console.log("Node: " + nodes[0].toString())

const fpath = 'F:\\geomodelling\\webNJGIS_backend_ts\\dist\\upload\\geo-data\\5a0abb3cfaa10b56b4eb598d.zip';
const fpath2 = 'F:\\geomodelling\\webNJGIS_backend_ts\\dist\\upload\\geo-data\\5a0abb3cfaa10b56b4eb598d_2.zip';

const unzipPath = 'F:\\geomodelling\\webNJGIS_backend_ts\\dist\\upload\\geo-data\\5a0abb3cfaa10b56b4eb598d_2';
fs.readFile(fpath, (err, buf) => {
    const strbuf = buf.toString();
    console.log(strbuf);
    const newBuf = new Buffer(strbuf);
    fs.writeFile(fpath2, strbuf, {encoding: 'utf8'}, err => {
        if(err) {
            console.log(err);
        }
        else {
            const unzipExtractor = unzip.Extract({ path: unzipPath });
            fs.createReadStream(fpath2).pipe(unzipExtractor);
            unzipExtractor.on('error', err => {
                console.log(err);
            });
            unzipExtractor.on('close', () => {
                console.log('closed');
            });
        }
    });
});