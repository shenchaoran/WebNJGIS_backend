import * as fs from 'fs';
import * as path from 'path';
import { siteDB } from '../models';
import * as _ from 'lodash';

fs.readFile(path.join(__dirname, '../..', 'IBIS_siteid.txt'), 'utf-8', (err, buf) => {
    if(err) {
        console.log(err);
    }
    else {
        const str = buf.toString();
        const rows = str.split(/\r\n|\r|\n/g);
        const docs = _
            .chain(rows)    
            .filter(item => item !== '')
            .map((row, i) => {
                const temp = row.split(',');
                if(temp.length === 3) {
                    return {
                        index: i+1,
                        x: temp[0],
                        y: temp[1]
                    };
                }
            })
            .filter(item => item != undefined)
            .value();
            
        siteDB.insertBatch(docs)
            .then(rsts => {
                rsts;
            });
    }
});