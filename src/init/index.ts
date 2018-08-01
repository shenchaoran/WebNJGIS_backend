import { initEnv } from './init-env';
import { initUser } from './init-user';
import { initFolders } from './init-folder';
import * as Promise from 'bluebird';

export const init = () => {
    
    return new Promise((resolve, reject) => {
        Promise.all([
            // connect2MSC(), 
            // initEnv(),
            initUser(),
            initFolders()
        ])
            .then((rsts) => {
                return resolve(rsts);
            })
            .catch(err => {
                return reject(err);
            })
    });
};