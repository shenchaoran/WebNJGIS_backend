import { taskDB } from '../models';

taskDB.insert({
    meta: {
        name: 'tes'
    }
})
    .then(rst=> {
        rst;
        console.log(rst);
    })