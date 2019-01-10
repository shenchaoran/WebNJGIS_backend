import { Response, Request, NextFunction } from 'express';
const express = require('express');
import { SchemaModel } from '../models'

const router = express.Router();
module.exports = router;

router.route('/').get((req: Request, res: Response, next: NextFunction) => {
        // SchemaModel.find({})
        //     .then(rst => {
        //         return res.json({ data: rst });
        //     })
        //     .catch(next);
        return res.json({data: (process as any).schemas})
    });