import { Response, Request, NextFunction } from "express";

const MyRouter = require('./base.route');
import ModelToolsCtrl from './../controllers/model-tools.controller';
import { modelServiceDB } from '../models/model-service.model';
const db = modelServiceDB;

const defaultRoutes = [
    'insert',
    'find',
    'remove'
];

const router = new MyRouter(modelServiceDB, defaultRoutes);
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        // db
        //     .find({})
        //     .then(docs => {
        //         return ModelToolsCtrl.convert2Tree(req.query.user, docs)
        //     })
        //     .then(docs => {
        //         res.locals.resData = docs;
        //         res.locals.template = {};
        //         res.locals.succeed = true;
        //         return next();
        //     })
        //     .catch(next);

        if(req.query.pageSize === undefined) {
            req.query.pageSize = 25;
        }
        else {
            req.query.pageSize = parseInt(req.query.pageSize);
        }
        if(req.query.pageNum === undefined) {
            req.query.pageNum = 1;
        }
        else {
            req.query.pageNum = parseInt(req.query.pageNum);
        }

        ModelToolsCtrl.findByPage({
            pageSize: req.query.pageSize,
            pageNum: req.query.pageNum
        })
            .then(rst => {
                res.locals.resData = rst;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });

router.route('/:id')
    .get((req: Request, res: Response, next: NextFunction) => {
        ModelToolsCtrl.getModelDetail(req.params.id)
            .then(rst => {
                res.locals = {
                    resData: rst,
                    template: {},
                    succeed: true
                };
                return next();
            })
            .catch(next);
    });