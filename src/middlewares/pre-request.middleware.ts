import { Response, Request, NextFunction } from "express";
const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const session = require('express-session');

const MyRouter = require('../routes/base.route');
import { setting } from '../config/setting';

const router = new MyRouter();
module.exports = router;

// 压缩网页
router.use(compression());
// 打印到调试控制台
router.use(logger("dev"));
// 解析json格式的http请求体，通过req.body使用
router.use(bodyParser.json());
// 解析文本格式的http请求体，通过req.body使用
router.use(bodyParser.urlencoded({ extended: true }));
// 验证用户提交的数据，通过req.checkBody, checkParams, checkQuery ...使用
router.use(expressValidator());
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

// TODO 可以把登录模块放在这里
router.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.userid = 'I am a userid';
    res.locals.ticket = 'I am a token';
    return next();
});

// 解析cookie，通过req.cookies使用
router.use(cookieParser());
// 加载静态资源中间件，前后端分离就不要了
// router.use(express.static(path.join(__dirname, 'public')));

// all cross origin
router.all('*', function(req: Request, res: Response, next: NextFunction) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    if (req.method == "OPTIONS") {
        // 预检请求直接返回
        return res.send(200);
    } else {
        return next();
    }
});