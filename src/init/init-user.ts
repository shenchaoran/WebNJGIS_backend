import { UserModel } from '../models/user.model';
import * as Bluebird from 'bluebird';
const debug = require('debug');
const initDebug = debug('WebNJGIS: Init');

export const initUser = (): Bluebird<any> => {
    return new Bluebird((resolve, reject) => {
        UserModel.find({ username: 'Admin' })
            .then(user => {
                if (user.length >= 1) {
                    initDebug('Init account succeed!');
                    return resolve('initUser');
                } else {
                    UserModel.insert({
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
