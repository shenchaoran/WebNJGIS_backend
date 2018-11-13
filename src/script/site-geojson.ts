import * as path from 'path';
import { siteDB } from '../models';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const GeoJSON = Bluebird.promisifyAll(require('geojson'));
const fs = Bluebird.promisifyAll(require('fs'));

fs.readFileAsync(path.join(__dirname, '../..', 'IBIS_site_coor.txt'), 'utf-8')
    .then(buf => {
        let str = buf.toString();
        str = str.trim();
        const rows = str.split(/\r\n|\r|\n/g);
        const docs = _
            .chain(rows)    
            .filter(item => item !== '')
            .map((row, i) => {
                const temp = row.split(/\s/);
                if(temp.length >= 2) {
                    return {
                        index: i+1,
                        x: parseFloat(temp[0]),
                        y: parseFloat(temp[1])
                    };
                }
            })
            .filter(item => item != undefined)
            .value();
        return docs;
    })
    .then(docs => {
        return GeoJSON.parse(docs, {
            Point: ['y', 'x']
        }, geojson => {
            return fs.writeFileAsync(path.join(__dirname, '../../IBIS_site.json'), JSON.stringify(geojson))
        });
    })
    .catch(console.log);