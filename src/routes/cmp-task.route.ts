import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
const router = new MyRouter();
module.exports = router;

import * as CmpTaskCtrl from '../controllers/cmp-task.controller';

router.route('/').post(CmpTaskCtrl.insert);

router.route('/:id').get(CmpTaskCtrl.find);

router.route('/:id').put(CmpTaskCtrl.update);

router.route('/:id').delete(CmpTaskCtrl.remove);
