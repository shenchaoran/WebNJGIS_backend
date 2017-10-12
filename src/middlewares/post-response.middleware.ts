import { Response, Request, NextFunction } from "express";

const MyRouter = require('../routes/base.route');
const ResponseModel = require('../models/response.model');

const router = new MyRouter();
module.exports = router;

// unify response 
router.use((req: Request, res: Response, next: NextFunction) => {
    // console.log(res.locals);
    if(res.locals.successed === true) {
        const resData = new ResponseModel();
        resData.href = req.originalUrl;
        resData.ticket = res.locals.ticket;
        resData.userid = res.locals.userid;
        resData.status = {
            code: '200',
            desc: 'successed'
        };
        resData.data = res.locals.resData;
        resData.template = res.locals.template;
        return res.json(resData);
    }
    else {
        return next();
    }
});

// catch 404 and forward to error handler
router.use((req: Request, res: Response, next: NextFunction) => {
    const err = <any>(new Error('Not Found'));
    err.status = 404;
    next(err);
});

// error handler
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const resData = new ResponseModel();
    resData.href = req.originalUrl;
    resData.ticket = res.locals.ticket;
    resData.userid = res.locals.userid;
    resData.status = {
        code: err.status || 500,
        desc: err.message,
        stack: req.app.get('env') === 'development' 
                    ? err.stack
                    : {}
    };
    return res.json(resData);
});