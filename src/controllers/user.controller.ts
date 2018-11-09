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
                    user.avator = "data:image/png;base64," + imgData;
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


/**
 * @return  { error: { code, desc }}
 *          { data: { updateInfo, user},message,code}
 */
export const setUp = (req: Request, res: Response, next: NextFunction) => {
    const url = req.body.url;
    const group = req.body.group;
    const location = req.body.location;
    const avator = req.body.file;
    const id = req.body.id;
    const user = {
        url: url,
        group: group,
        location: location,
        avator: avator
    };
    console.log("id:" + id);
    userDB.findOne({ _id: id })
        .then(user_rst => {
            if (user_rst.url !== null && url === '') {
                user.url = user_rst.url;
            }
            if (user_rst.group !== null && group === '') {
                user.group = user_rst.group;
            }
            if (user_rst.location !== null && location === '') {
                user.location = user_rst.location;
            }
            if (avator === "") {
                if (user_rst.avator === null) {
                    let imgData = new Identicon(md5(user_rst.username), {
                        size: 45
                    }).toString();
                    user.avator = "data:image/png;base64," + imgData;
                } else {
                    user.avator = user_rst.avator;
                }
            }
            userDB.update({ _id: id }, user)
                .then(rst => {
                    return res.json({
                        data: {
                            updateInfo: rst,
                            user: user
                        },
                        message: "",
                        code: "1",
                    });
                })
                .catch(e => {
                    return res.json({
                        error: {
                            code: 401,
                            desc: 'Failed to update'
                        }
                    });
                })
        })
        .catch(e => {
            return res.json({
                error: {
                    code: 401,
                    desc: 'your username hadn\'t registered before, please registe first!'
                }
            });
        })
        .catch(next);
}

export const getUserInfo = (req: Request, res: Response, next: NextFunction) => {
    let userName = req.params.userName;
    userDB.findOne({ username: userName })
        .then(user => {
            user.password = null;
            return res.json({
                data: {
                    user: user
                }
            })
        })
        .catch(e => {
            res.json({
                error: {
                    code: 401,
                    desc: 'Can not find the user information.'
                }
            })
        })
};
