import * as Promise from 'bluebird';
const mongoose = require('mongoose');

import { setting } from '../config/setting';
const debug = require('debug');
const mongooseDebug = debug('WebNJGIS: Mongoose');

mongoose.Promise = require('bluebird');
const url =
    'mongodb://' +
    setting.mongodb.host +
    ':' +
    setting.mongodb.port +
    '/' +
    setting.mongodb.name;
    
mongoose.connect(url, {
    useMongoClient: true
});

mongoose.connection.on('connected', () => {
    mongooseDebug('Mongoose connected');
});

mongoose.connection.on('error', (err: any) => {
    mongooseDebug('Mongoose err\n' + err);
});

mongoose.connection.on('disconnected', () => {
    mongooseDebug('Mongoose disconnected');
});

export class Mongoose {
    private schema: any;
    private model: any;
    constructor(collectionName, schema) {
        this.schema = new mongoose.Schema(schema, {
            collection: collectionName
        });
        this.model = mongoose.model(collectionName, this.schema);
    }

    public find(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.find(where, (err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst);
                }
            });
        });
    }

    public remove(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.remove(where, err => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve();
                }
            });
        });
    }

    public insert(item): Promise<any> {
        const model = new this.model(item);
        return new Promise((resolve, reject) => {
            model.save((err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst._doc);
                }
            });
        });
    }

    public update(where, update, options?): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.update(where, update, (err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst);
                }
            });
        });
    }
}
