/**
 * 路由级中间件，负责user的认证
 */

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
import { userDB } from '../models/user.model';

export const userAuthMid = app => {
	// 此处其实不用使用应用级中间件，放在需要登录验证的模块中，比如个人中心，使用路由级中间件
	// 登陆验证拦截器，根据header中的Authorization (token)得到user，并放在req.query中
	app.use('*', (req: Request, res: Response, next: NextFunction) => {
		const skipUrls = ['auth'];
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

		// 对于某些情况下不能写入到请求头，所以允许在body或者query中存放认证信息
		// 比如window.open时
		let token =
			(req.body && req.body.Authorization) ||
			(req.query && req.query.Authorization) ||
			req.header('Authorization');
		if (token && token.indexOf('bearer ') !== -1) {
			token = token.split('bearer ')[1];
		} else {
			if (setting.auth === false) {
				return next();
			} else {
				const err = <any>new Error(
					'No user authorization, please login in first!'
				);
				err.status = 401;
				return next(err);
			}
		}

		if (token) {
			try {
				const decoded = jwt.decode(token, setting.jwt_secret);
				// console.log(decoded);
				if (decoded.exp <= Date.now()) {
					if (setting.auth === false) {
						return next();
					} else {
						const err = <any>new Error('Access token has expired');
						err.status = 402;
						return next(err);
					}
				} else {
					userDB
						.find({ username: decoded.iss })
						.then(users => {
							if (users.length === 0) {
								if (setting.auth === false) {
									return next();
								} else {
									const err = <any>new Error(
										'Please login in first!'
									);
									err.status = 402;
									return next(err);
								}
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
};
