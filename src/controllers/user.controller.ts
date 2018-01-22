import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';
const jwt = require('jwt-simple');
const moment = require('moment');
import * as _ from 'lodash';

import * as RequestCtrl from './request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
import { userDB, UserClass } from '../models/user.model';

export const login = (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username;
    const password = req.body.password;
    if(username === undefined || password === undefined) {
        res.locals.resData = {
            succeed: false
        }
        res.locals.template = {};
        res.locals.succeed = true;
        return next();
    }
    userDB.find({ username: username })
        .then(user => {
            user = user[0];
            if (user.password === password) {
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

                user.password = 'u guess!';
                res.locals.resData = {
                    succeed: true,
                    jwt: {
                        token: token,
                        expires: expires,
                        user: user
                    }
                };
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            } else {
                res.locals.resData = {
                    succeed: false
                }
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            }
        })
        .catch(next);
};

export const logout = (req: Request, res: Response, next: NextFunction) => {};

export const register = (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    if(username !== undefined && password !== undefined && email !== undefined) {
        const user = {
            username: username,
            password: password,
            email: email
        };
        userDB.find({username: username})
            .then(rst => {
                if(rst.length === 0) {
                    return userDB.insert(user);
                }
                else {
                    const err = <any>(new Error('username has registered!'));
                    err.status = 417;
                    return Promise.reject(err);
                }
            })
            .then(rst => {
                res.locals.resData = {
                    succeed: true
                }
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    }
    else {
        res.locals.resData = {
            succeed: false
        }
        res.locals.template = {};
        res.locals.succeed = true;
        return next();
    }
};
export const findPst = (req: Request, res: Response, next: NextFunction) => {};
