import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
const jwt = require('jwt-simple');
const moment = require('moment');
import * as _ from 'lodash';

import * as RequestCtrl from '../utils/request.utils';
import { setting } from '../config/setting';
import { userDB, User } from '../models/user.model';
import * as crypto from 'crypto';
const Identicon = require('identicon.js');
const md5 = (v) => {
    return crypto.createHash('md5').update(v, 'utf8').digest('hex');
};

/**
 * @return  { error: { code, desc } }
 *          { data: { token, expires, user} }
 */
export const signIn = (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username === undefined || password === undefined) {
        return res.json({
            error: {
                code: 401,
                desc: `${!username ? 'username' : 'password'} can\'t be empty`
            }
        });
    }
    userDB.findOne({ username: username })
        .then(user => {
            if (user.password === md5(password)) {
                const expires = moment()
                    .add(7, 'days')
                    .valueOf();
                const token = jwt.encode(
                    {
                        iss: user.username,
                        exp: expires
                    },
                    setting.jwt_secret
                );

                user.password = null;
                return res.json({
                    data: {
                        token: token,
                        expires: expires,
                        user: user
                    }
                });
            }
            else {
                return res.json({
                    error: {
                        code: 401,
                        desc: 'password error!'
                    }
                });
            }
        })
        .catch(e => {
            res.json({
                error: {
                    code: 401,
                    desc: 'your username hadn\'t registered before, please registe first!'
                }
            })
        });
};

export const logout = (req: Request, res: Response, next: NextFunction) => {

};

/**
 * @return  { error: { code, desc }}
 *          { data: { token, expires, user}}
 */
export const signUp = (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    if (username && password && email) {
        const user = {
            username: username,
            password: md5(password),
            email: email,
            avator: null
        };
        userDB.findOne({ username: username })
            .then(rst => {
                return res.json({
                    error: {
                        code: 401,
                        desc: 'Username had be registered!'
                    }
                });
            })
            .catch(e => {
                if (e.message === 'No data found!') {
                    let imgData = new Identicon(md5(user.username), {
                        size: 45
                    }).toString();
                    user.avator = imgData;
                    return userDB.insert(user)
                        .then(rst => {
                            let expires = moment().add(7, 'days').valueOf();
                            user.password = null;
                            return res.json({
                                data: {
                                    expires: expires,
                                    token: jwt.encode(
                                        {
                                            iss: user.username,
                                            exp: expires
                                        },
                                        setting.jwt_secret
                                    ),
                                    user: user
                                }
                            });
                        })
                }
            })
            .catch(next);
    }
    else {
        return res.json({
            error: {
                code: 401,
                desc: 'please fill in the form completely!'
            }
        });
    }
};

/**
 * @return  { error: {code, desc}}
 *          { data: {}}
 */
export const resetPassword = (req: Request, res: Response, next: NextFunction) => { };
