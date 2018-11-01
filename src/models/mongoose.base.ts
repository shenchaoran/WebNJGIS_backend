import { filter } from 'rxjs/operators';
import * as Promise from 'bluebird';
const mongoose = require('mongoose');
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import { setting } from '../config/setting';

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
    console.log('******** Mongoose connected')
});

mongoose.connection.on('error', (err: any) => {
    console.log('******** Mongoose error', err)
});

mongoose.connection.on('disconnected', () => {
    console.log('******** Mongoose disconnected')
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
                    if (docs.length) {
                        return resolve(docs[0]._doc);
                    }
                    else {
                        return resolve(null);
                    }
                }
            });
        });
    }

    public findByIds(ids: string[]): Promise<any> {
        return Promise.map(ids, id => {
            return new Promise((resolve, reject) => {
                this.findOne({ _id: id })
                    .then(resolve)
                    .catch(e => {
                        console.log(e)
                        return resolve(undefined)
                    })
            });
        }, {
                concurrency: 5
            })
            .then(docs => {
                return _.chain(docs as Array<any>)
                    .filter(doc => doc !== undefined)
                    .map(doc => {
                        doc._id = doc._id.toString()
                        return doc;
                    })
                    .value()
            })
    }

    public find(where): Promise<any> {
        return new Promise((resolve, reject) => {
            this.model.find(where).sort({ _id: -1 }).exec((err, docs) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(_.map(docs as any[], doc => {
                        return doc.toJSON();
                    }));
                }
            })
        });
    }

    /**
     * 分页查询
     * @return
     *      {
     *          count: number,
     *          docs: any[]
     *      }
     */
    public findByPage(where, pageOpt: {
        pageSize: number,
        pageIndex: number
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
                    .find(where)
                    .sort({ _id: -1 })
                    .limit(pageOpt.pageSize)
                    .skip(pageOpt.pageSize * (pageOpt.pageIndex - 1))
                    .exec((err, docs) => {
                        if (err) {
                            return reject(err);
                        } else {
                            // TODO ????
                            return resolve(docs.map(doc => doc._doc));
                        }
                    })
            })
        ])
            .then(([count, docs]) => {
                return Promise.resolve({
                    count,
                    docs
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
        let queryId
        if (item._id) {
            queryId = item._id;
        }
        else {
            queryId = new ObjectID();
            item._id = queryId;
        }
        return new Promise((resolve, reject) => {
            this.model.findOneAndUpdate(
                {
                    _id: queryId
                },
                item,
                {
                    upsert: true
                },
                (err, doc) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        if (doc)
                            resolve(doc._doc)
                        else
                            resolve(item)
                    }
                }
            )
        });
    }

    public insertBatch(docs): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!docs || docs.length === 0) {
                return resolve();
            }
            else {
                Promise.map(docs, (doc) => {
                    return this.insert(doc)
                })
                    .then(resolve)
                    .catch(reject)
                // this.model.collection.insert(docs, options, (err, rst) => {
                //     if (err) {
                //         return reject(err);
                //     }
                //     else {
                //         return resolve(rst);
                //     }
                // });
            }
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

    public upsert(where, update, options?): Promise<any> {
        return new Promise((resolve, reject) => {
            if (options === undefined) {
                options = {};
            }
            options.upsert = true;
            this.model.update(where, update, options, (err, rst) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(rst);
                }
            });
        });
    }

    /**
     * 查询用户相关的数据 包括用户创建和用户订阅的
     * @return
     *      {
     *          count: number,
     *          docs: any[]
     *      }
     */
    public findByUserId(userId): Promise<any> {
        return Promise.all([
            new Promise((resolve, reject) => {
                this.model
                    .find({ "auth.userId": userId })
                    .sort({ _id: -1 })
                    .exec((err, docs) => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve(_.map(docs as any[], doc => {
                                return doc.toJSON();
                            }));
                        }
                    })
            }),
            new Promise((resolve, reject) => {
                this.model
                    .find()
                    .sort({ _id: -1 })
                    .exec((err, docs) => {
                        if (err) {
                            return reject(err);
                        } else {
                            let subscribed_docs = docs.filter(doc => {
                                return doc.subscribed_uids.indexOf(userId) !== -1;
                            });
                            return resolve(_.map(subscribed_docs as any[], doc => {
                                return doc.toJSON();
                            }));
                        }
                    })
            })
        ])
            .then(rsts => {
                let docs_created: any[];
                let docs_subscribed: any[];
                docs_created = rsts[0] === null ? [] : rsts[0] as any[];
                docs_subscribed = rsts[1] === null ? [] : rsts[1] as any[];
                return Promise.resolve({
                    docs: _.concat(docs_created, docs_subscribed),
                });
            })
            .catch(Promise.reject);
    }


}


export class OgmsObj {
    _id?: any;

    constructor(obj?: any) {
        if (obj) {
            _.assign(this, obj);
        }
        else {
            this._id = new ObjectID();
        }
    }
}