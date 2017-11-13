import { Response, Request, NextFunction } from 'express';
import * as Promise from 'bluebird';

import * as RequestCtrl from '../controllers/request.controller';
import { setting } from '../config/setting';
import * as APIModel from '../models/api.model';
const initDebug = debug('WebNJGIS: Init');

export const connect2MSC = (): Promise<any> => {
    const url = APIModel.getAPIUrl('connector');
    return new Promise((resolve, reject) => {
        RequestCtrl.getByServer(url, undefined)
            .then(response => {
                initDebug('Connected to MSC succeed!');
                return resolve('connect2MSC');
            })
            .catch(error => {
                initDebug('Connected to MSC failed!');
                return reject(error);
            });
    });
};
