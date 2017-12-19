import { Response, Request, NextFunction } from 'express';

const ResponseModel = require('../models/response.class');

module.exports = (app) => {
    // unify response
    app.use((req: Request, res: Response, next: NextFunction) => {
        // console.log(res.locals);
        if (res.locals.succeed === true) {
            const resData = new ResponseModel();
            resData.href = req.originalUrl;
            resData.token = res.locals.token;
            resData.username = res.locals.username;
            resData.status = {
                code: '200',
                desc: 'succeed'
            };
            resData.data = res.locals.resData;
            resData.template = res.locals.template;
            return res.json(resData);
        } else {
            return next();
        }
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
        const err = <any>new Error('Not Found');
        err.status = 404;
        next(err);
    });

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.log(err);
        const resData = new ResponseModel();
        resData.href = req.originalUrl;
        resData.token = res.locals.token;
        resData.username = res.locals.username;
        resData.status = {
            code: err.status || 500,
            desc: err.message,
            stack: req.app.get('env') === 'development' ? err.stack : {}
        };
        return res.json(resData);
    });
}