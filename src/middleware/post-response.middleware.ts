import { Response, Request, NextFunction } from "express";
// const errorHandler = require("errorhandler");

const MyRouter = require('../routes/base.route');

const router = new MyRouter();
module.exports = router;

// router.use(errorHandler());

// catch 404 and forward to error handler
router.use(function(req: Request, res: Response, next: NextFunction) {
    const err = <any>(new Error('Not Found'));
    err.status = 404;
    next(err);
});

// error handler
router.use(function(err: any, req: Request, res: Response, next: NextFunction) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});