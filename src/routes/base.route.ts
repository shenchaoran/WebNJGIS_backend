import { Response, Request, NextFunction, Router } from "express";
const express = require('express');

module.exports = class MyRouter{
    constructor() {
        const router = express.Router();
        router.route('/ping')
            .get((req: Request, res: Response, next: NextFunction) => {
                return res.send(`request url is: \'${req.url}\'`);
            });
        return router;
    }
};