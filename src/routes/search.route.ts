import { Response, Request, NextFunction } from 'express';
const express = require('express');
import SearchCtrl from '../controllers/search.controller';

const router = express.Router();
module.exports = router;

router.route('')
    .get((req: Request, res: Response, next: NextFunction) => {
        SearchCtrl.search(req.query)
            .then(rst => {
                return res.json({
                    data: rst
                });
            })
            .catch(next);
    });

//  RouterExtends(router, OgmsModel, defaultRoutes);