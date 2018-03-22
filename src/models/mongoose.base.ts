import * as Promise from 'bluebird';
const mongoose = require('mongoose');
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';

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

    public findOne(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.find(where, (err, docs) => {
                if (err) {
                    return reject(err);
                } else {
                    if(docs.length) {
                        return resolve(docs[0]._doc);
                    }
                    else {
                        return reject(new Error('Can\'t find data by ' + JSON.stringify(where)));
                    }
                }
            });
        });
    }

    public find(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.find(where, (err, docs) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(_.map(docs as any[], doc => {
                        return doc.toJSON();
                    }));
                }
            });
        });
    }

    /**
     * 分页查询
     * return 
     *      {
     *          count: number,
     *          docs: any[]
     *      }
     */
    public findByPage(where, pageOpt: {
        pageSize: number,
        pageNum: number
    }): Promise<any> {
        return Promise.all([
            new Promise((resolve, reject) => {
                this.model
                    .find()
                    .count((err, count) => {
                        if (err) {
                            return reject(err)
                        } else {
                            return resolve(count);
                        }
                    });
            }),
            new Promise((resolve, reject) => {
                this.model
                    .find(where, (err, docs) => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve(_.map(docs as any[], doc => {
                                return doc.toJSON();
                            }));
                        }
                    })
                    .limit(pageOpt.pageSize)
                    .skip(pageOpt.pageSize* (pageOpt.pageNum- 1));
            })
        ])
            .then(rsts => {
                return Promise.resolve({
                    count: rsts[0],
                    docs: rsts[1]
                });
            })
            .catch(Promise.reject);
    }

    public remove(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.remove(where, (err, doc) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(doc);
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

    public insertBatch(docs, options?): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.collection.insert(docs, options, (err, rst) => {
                if(err) {
                    return reject(err);
                }
                else {
                    return resolve(rst);
                }
            });
        });
    }

    public update(where, update, options?): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.update(where, update, options, (err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst);
                }
            });
        });
    }
}


export class OgmsObj {
    _id?: any;
    
    constructor(obj?: any) {
        if(obj) {
            _.assign(this, obj);
        }
        else {
            this._id = new ObjectID();
        }
    }
}