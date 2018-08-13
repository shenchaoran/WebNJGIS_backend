import { initEnv } from './init-env';
import { initUser } from './init-user';
import { initFolders } from './init-folder';
import { initCopyFiles } from './init-copy'
import * as Promise from 'bluebird';

export const init = () => {
    
    return new Promise((resolve, reject) => {
        Promise.all([
            // connect2MSC(), 
            // initEnv(),
            // initCopyFiles(),
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