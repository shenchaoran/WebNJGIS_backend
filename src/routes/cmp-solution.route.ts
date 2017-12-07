import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
const router = new MyRouter();
module.exports = router;

import * as CmpSolutionCtrl from '../controllers/cmp-solution.controller';

router.route('/').post(CmpSolutionCtrl.insert);

router.route('/:id').get(CmpSolutionCtrl.find);

router.route('/:id').put(CmpSolutionCtrl.update);

router.route('/:id').delete(CmpSolutionCtrl.remove);
