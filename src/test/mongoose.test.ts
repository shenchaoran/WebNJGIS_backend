import { TaskModel } from '../models';

TaskModel.insert({
    meta: {
        name: 'tes'
    }
})
    .then(rst=> {
        rst;
        console.log(rst);
    })