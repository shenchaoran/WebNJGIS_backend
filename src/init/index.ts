import { initEnv } from './init-env';
import { initUser } from './init-user';
import { initFolders } from './init-folder';
import * as Bluebird from 'bluebird';

export const init = () => {
    
    return new Bluebird((resolve, reject) => {
        Bluebird.all([
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