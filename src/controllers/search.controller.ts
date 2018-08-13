import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { ObjectID } from 'mongodb';
import * as fs from 'fs';
const request = require('request');
import * as unzip from 'unzip';

import { setting } from '../config/setting';
import { geoDataDB, GeoDataClass, STD_DATA } from '../models/UDX-data.model';
import * as RequestCtrl from '../utils/request.utils';

export default class SearchCtrl {
    constructor() {}

    // TODO
    static search(options): Promise<any> {
        const categories = [
            {
                name: 'Issues',
                num: '5',
                children: [
                    {
                        label: 'Model Categories',
                        key: 'Model_Categories',
                        values: [
                            {
                                name: 'Carbon cycle mode',
                                num: '23'
                            },
                            {
                                name: 'Ocean',
                                num: '223'
                            },
                            {
                                name: 'Territory',
                                num: '1K'
                            },
                            {
                                name: 'Meteorological',
                                num: '55'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Solutions',
                num: '28',
                children: [
                    {
                        label: 'Model Categories',
                        key: 'Model_Categories',
                        values: [
                            {
                                name: 'Carbon cycle mode',
                                num: '23'
                            },
                            {
                                name: 'Ocean',
                                num: '223'
                            },
                            {
                                name: 'Territory',
                                num: '1K'
                            },
                            {
                                name: 'Meteorological',
                                num: '55'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Tasks',
                num: '45',
                children: [
                    {
                        label: 'Model Categories',
                        key: 'Model_Categories',
                        values: [
                            {
                                name: 'Carbon cycle mode',
                                num: '23'
                            },
                            {
                                name: 'Ocean',
                                num: '223'
                            },
                            {
                                name: 'Territory',
                                num: '1K'
                            },
                            {
                                name: 'Meteorological',
                                num: '55'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Models',
                num: '523',
                children: [
                    {
                        label: 'Model Categories',
                        key: 'Model_Categories',
                        values: [
                            {
                                name: 'Carbon cycle mode',
                                num: '23'
                            },
                            {
                                name: 'Ocean',
                                num: '223'
                            },
                            {
                                name: 'Territory',
                                num: '1K'
                            },
                            {
                                name: 'Meteorological',
                                num: '55'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'Data',
                num: ''
            }
        ];
        const list = [
            {
                name: 'BIOME',
                description: 'You can use our powerful search tools to find what you\'re looking for among the millions of repositories, users, and lines of code on GitHub.'
            },
            {
                name: 'BIOME',
                description: 'You can use our powerful search tools to find what you\'re looking for among the millions of repositories, users, and lines of code on GitHub.'
            }
        ]
        return Promise.resolve({
            categories: categories,
            list: list
        });
    }
}