import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import { ComputingNode, computingNodeDB, calcuTaskDB } from '../models';
import SearchCtrl from '../controllers/search.controller';
import { nodeAuthMid } from '../middlewares/node-auth.middleware';

const router = new MyRouter(undefined, undefined);
module.exports = router;

nodeAuthMid(router);

router.route('')
    .get((req: Request, res: Response, next: NextFunction) => {
        SearchCtrl.search(req.query)
            .then(rst => {
                res.locals = {
                    resData: rst,
                    succeed: true,
                    template: {}
                };
                return next();
            })
            .catch(next);
    });