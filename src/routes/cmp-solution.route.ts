import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import * as CmpSolutionCtrl from '../controllers/cmp-solution.controller';
import { cmpSolutionDB } from '../models/cmp-solution.model';
const db = cmpSolutionDB;

const defaultRoutes = [
    'insert',
    'remove',
    'update'
];

const router = new MyRouter(cmpSolutionDB, defaultRoutes);
module.exports = router;

// region auth
import { userAuthMid } from '../middlewares/user-auth.middleware';
userAuthMid(router);
// endregion

// router.route('/:id').get(cmpSolutionDB.find);

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
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
        
        CmpSolutionCtrl.findByPage({
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
        CmpSolutionCtrl.getSlnDetail(req.params.id)
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