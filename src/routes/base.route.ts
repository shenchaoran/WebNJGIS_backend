import { Response, Request, NextFunction, Router } from "express";
const express = require('express');

module.exports = class MyRouter{
    constructor() {
        const router = express.Router();
        router.route('/ping')
            .get((req: Request, res: Response, next: NextFunction) => {
                res.locals.succeed = true;
                res.locals.resData = [{
                    href: req.originalUrl
                }];
                res.locals.template = [{
                    href: 'string'
                }];
                return next();
            });
        return router;
    }
};