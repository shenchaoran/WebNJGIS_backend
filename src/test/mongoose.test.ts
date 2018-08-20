import { cmpTaskDB } from '../models';

cmpTaskDB.insert({
    meta: {
        name: 'tes'
    }
})
    .then(rst=> {
        rst;
        console.log(rst);
    })