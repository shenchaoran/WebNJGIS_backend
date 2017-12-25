import { computingNodeDB } from '../models/user.model';
import * as Promise from 'bluebird';
const debug = require('debug');
const initDebug = debug('WebNJGIS: Init');

export const initUser = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        computingNodeDB.find({ username: 'Admin' })
            .then(user => {
                if (user.length >= 1) {
                    initDebug('Init account succeed!');
                    return resolve('initUser');
                } else {
                    computingNodeDB.insert({
                        username: 'Admin',
                        password: '123456',
                        email: 'shenchaoran212@gmail.com'
                    })
                        .then(rst => {
                            initDebug('Init account succeed!');
                            return resolve('initUser');
                        })
                        .catch(err => {
                            initDebug(err);
                            return reject(err);
                        });
                }
            })
            .catch(err => {
                initDebug(err);
                return reject(err);
            });
    });
};
