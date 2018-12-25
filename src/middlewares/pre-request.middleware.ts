import { Response, Request, NextFunction } from 'express';
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const session = require('express-session');
const jwt = require('jwt-simple');
const path = require('path');
const favicon = require('serve-favicon');
import * as _ from 'lodash';
const methodOverride = require('method-override');

import { setting } from '../config/setting';
import { UserModel } from '../models/user.model';

export const preReqMid = (app) => {
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

    // favicon
    // app.use(favicon(path.join(__dirname, '..', 'public/images/favicon.png')));

    // 加载静态资源中间件，前后端分离就不要了
    app.use(setting.API_prefix, express.static(path.join(__dirname, '..', 'public')));

    app.use(methodOverride('X-HTTP-Method-Override'))
    
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
            'PUT,POST,GET,DELETE,PATCH,OPTIONS'
        );
        if (req.method == 'OPTIONS') {
            // 预检请求直接返回
            return res.sendStatus(200);
        } else {
            return next();
        }
    });
}