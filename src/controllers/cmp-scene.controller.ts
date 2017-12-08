import { Response, Request, NextFunction } from 'express';
import * as formidable from 'formidable';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';

import { UDXCfg, ExternalName } from '../models/UDX-schema.class';
import * as PropParser from './UDX.property.controller';
import * as UDXParser from './UDX.parser.controller';
import * as UDXComparators from './UDX.compare.control';
import { cmpSceneDB } from '../models/cmp-scene.model';
import { ResourceSrc } from '../models/resource.enum';

export const convert2Tree = (user, docs: Array<any>): Promise<any> => {
    const trees = {
        public: [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'bbbbbbbbb',
            expanded: true,
            items: []
        }],
        personal: undefined
    };
    const publicDocs = _.filter(docs, doc => doc.src === ResourceSrc.PUBLIC);
    let personalDocs = undefined;
    if(user && user.username !== 'Tourist') {
        trees.personal = [{
            type: 'root',
            label: 'Earth\'s carbon cycle model',
            value: undefined,
            id: 'ccccccccccc',
            expanded: true,
            items: []
        }];
        personalDocs = <Array<any>>_.filter(docs, doc => doc.userId === user._id);
        if(personalDocs) {
            _.map(personalDocs, doc => {
                trees.personal[0].items.push({
                    type: 'leaf',
                    label: (<any>doc).meta.name,
                    value: doc,
                    id: (<any>doc)._id
                });
            });
        }
    }
    _.map(publicDocs, doc => {
        trees.public[0].items.push({
            type: 'leaf',
            label: doc.meta.name,
            value: doc,
            id: doc._id
        });
    });

    return Promise.resolve(trees);
}