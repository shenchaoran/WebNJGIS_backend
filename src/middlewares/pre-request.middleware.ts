import { Response, Request, NextFunction } from 'express';
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const session = require('express-session');
const jwt = require('jwt-simple');
import * as _ from 'lodash';

import { setting } from '../config/setting';
import { UserModelInstance } from '../models/user.model';

module.exports = (app) => {
    // 私钥
    app.set('jwtTokenSecret', setting.jwt_secret)
    // 压缩网页
    app.use(compression());
    // 打印到调试控制台
    app.use(logger('dev'));
    // 解析json格式的http请求体，通过req.body使用
    app.use(bodyParser.json());
    // 解析文本格式的http请求体，通过req.body使用
    app.use(bodyParser.urlencoded({ extended: true }));
    // 验证用户提交的数据，通过req.checkBody, checkParams, checkQuery ...使用
    app.use(expressValidator());
    // 处理session的中间件，通过req.session使用
    // router.use(session({
    //     resave: true,
    //     saveUninitialized: true,
    //     secret: process.env.session_secret,
    //     cookie: { maxAge: 3600000 * 2}
    //     // store: new MongoStore({
    //     //   url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    //     //   autoReconnect: true
    //     // })
    //   }));

    // 解析cookie，通过req.cookies使用
    app.use(cookieParser());
    // 加载静态资源中间件，前后端分离就不要了
    // router.use(express.static(path.join(__dirname, 'public')));

    // all cross origin
    app.all('*', function(req: Request, res: Response, next: NextFunction) {
        // TODO 为防止CSRF攻击，应设置为前端所在的域名
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Content-Type,Content-Length, Authorization, Accept,X-Requested-With'
        );
        res.header(
            'Access-Control-Allow-Methods',
            'PUT,POST,GET,DELETE,OPTIONS'
        );
        if (req.method == 'OPTIONS') {
            // 预检请求直接返回
            return res.send(200);
        } else {
            return next();
        }
    });

    // 此处其实不用使用应用级中间件，放在需要登录验证的模块中，比如个人中心，使用路由级中间件
    // 登陆验证拦截器，根据header中的Authorization (token)得到user，并放在req.query中
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
        const skipUrls = ['auth', 'css'];
        let isSkiped = false;
        _.map(skipUrls, skipUrl => {
            if (!isSkiped) {
                if (req.originalUrl.indexOf(skipUrl) !== -1) {
                    isSkiped = true;
                }
            }
        });
        if (isSkiped) {
            return next();
        }

        let token =
            (req.body && req.body.Authorization) ||
            (req.query && req.query.Authorization) ||
            req.header('Authorization');
        if(token && token.indexOf('bearer ') !== -1) {
            token = token.split('bearer ')[1];
        }
        else {
            const err = <any>new Error(
                'No authorization, please login in first!'
            );
            err.status = 403;
            return next(err);
        }
        
        if (token) {
            try {
                const decoded = jwt.decode(token, setting.jwt_secret);
                // console.log(decoded);
                if (decoded.exp <= Date.now()) {
                    const err = <any>new Error('Access token has expired');
                    err.status = 406;
                    return next(err);
                } else {
                    UserModelInstance.find({ username: decoded.iss })
                        .then(users => {
                            if (users.length === 0) {
                                const err = <any>new Error(
                                    'Please login in first!'
                                );
                                err.status = 406;
                                return next(err);
                            } else {
                                const user = users[0];
                                req.query.user = user;
                                res.locals.username = user.username;
                                res.locals.token = token;
                                return next();
                            }
                        })
                        .catch(next);
                }
            } catch (err) {
                return next();
            }
        } else {
            next();
        }
    });
}