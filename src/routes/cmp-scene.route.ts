import { Response, Request, NextFunction } from 'express';
const MyRouter = require('./base.route');
const router = new MyRouter();
module.exports = router;

import * as CmpSceneCtrl from '../controllers/cmp-scene.controller';

router.route('/').post(CmpSceneCtrl.insert);

router.route('/:id').get(CmpSceneCtrl.find);

router.route('/:id').put(CmpSceneCtrl.update);

router.route('/:id').delete(CmpSceneCtrl.remove);
