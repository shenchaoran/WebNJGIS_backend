import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
import { ComputingNode, computingNodeDB, calcuTaskDB } from '../models';
import * as CalcuTaskCtrl from '../controllers/calcu-task.controller';
import * as ComputingNodeCtrl from '../controllers/computing-node.controller';
const db = computingNodeDB;

const defaultRoutes = [
    'insert',
    'find'
];

const router = new MyRouter(db, defaultRoutes);
module.exports = router;

router.route('/:nodeName/tasks/start')
    .post((req: Request, res: Response, next: NextFunction) => {
        ComputingNodeCtrl.auth({
            nodeName: req.params.nodeName,
            token: req.body.token
        })
            .then(() => {
                CalcuTaskCtrl.startMS(req.params.nodeName)
                    .then(docs => {
                        res.locals = {
                            resData: {
                                docs: docs
                            },
                            template: {},
                            succeed: true
                        };
                        next();
                    })
            })
            .catch(next);
    });

router.route('/:nodeName/tasks/:taskId/state')
    .put((req: Request, res: Response, next: NextFunction) => {
        if(req.body.newState) {
            CalcuTaskCtrl.updateState(req.params.nodeName, req.params.taskId, req.body.oldState, req.body.newState)
                .then(rst => {
                    res.locals = {
                        resData: {
                            succeed: true
                        },
                        template: {},
                        succeed: true
                    };
                    next();
                })
                .catch(next);
        }
    });

router.route('/:nodeName/tasks/:taskId')
    .put((req: Request, res: Response, next: NextFunction) => {

    });

router.route('/')
    .post((req: Request, res: Response, next: NextFunction) => {
        computingNodeDB.insert(req.body.doc)
            .then(_doc => {
                res.locals = {
                    resData: {
                        succeed: true
                    },
                    template: {},
                    succeed: true
                };
                next();
            })
            .catch(next);
    });