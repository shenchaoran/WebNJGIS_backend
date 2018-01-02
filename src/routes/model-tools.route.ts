import { Response, Request, NextFunction } from "express";

const MyRouter = require('./base.route');
import * as ModelToolsCtrl from './../controllers/model-tools.controller';
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
        db
            .find({})
            .then(docs => {
                return ModelToolsCtrl.convert2Tree(req.query.user, docs)
            })
            .then(docs => {
                res.locals.resData = docs;
                res.locals.template = {};
                res.locals.succeed = true;
                return next();
            })
            .catch(next);
    });