import { Response, Request, NextFunction } from 'express';

const ResponseModel = require('../models/response.class');

export const postResMid = app => {
    // unify response
    // app.use((req: Request, res: Response, next: NextFunction) => {
    //     if (res.locals.succeed === true) {
    //         const response = new ResponseModel();
    //         // resData.href = req.originalUrl;
    //         // resData.token = res.locals.token;
    //         // resData.username = res.locals.username;
    //         response.data = res.locals.resData;
    //         return res.json(response);
    //     } else {
    //         return next();
    //     }
    // });

    app.use((req: Request, res: Response, next: NextFunction) => {
        const err = <any>new Error('Not Found');
        err.status = 404;
        next(err);
    });

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.log(err);
        const response = new ResponseModel();
        // resData.token = res.locals.token;
        // resData.username = res.locals.username;
        response.error = {
            code: err.status || 500,
            desc: err.message,
            stack: req.app.get('env') === 'development' ? err.stack : {}
        };
        return res.json(response);
    });
};
