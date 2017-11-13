import { connect2MSC } from './connect-MSC';
import { initUser } from './init-user';
import * as Promise from 'bluebird';

export const init = () => {
    return new Promise((resolve, reject) => {
        Promise.all([connect2MSC(), initUser()])
            .then((rsts) => {
                return resolve(rsts);
            })
            .catch(err => {
                return reject(err);
            })
    });
};