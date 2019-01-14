import * as fs from 'fs';
import * as path from 'path';
import { ObsSiteModel } from '../models';
import * as _ from 'lodash';

fs.readFile(path.join(__dirname, '../..', 'IBIS_site_coor.txt'), 'utf-8', (err, buf) => {
    if(err) {
        console.log(err);
    }
    else {
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
            
        ObsSiteModel.insertMany(docs)
            .then(rsts => {
                rsts;
            });
    }
});