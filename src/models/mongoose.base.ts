import { filter } from 'rxjs/operators';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import { setting } from '../config/setting';
import { Model, connect, connection, Document } from 'mongoose';
import * as mongoose from 'mongoose';

(mongoose as any).Promise = require('bluebird') as any;
const url = `mongodb://${setting.mongodb.host}:${setting.mongodb.port}/${setting.mongodb.name}`;
connect(url, { useNewUrlParser: true });
connection.on('connected', () => {
    console.log('******** Mongoose connected')
});
connection.on('error', (err: any) => {
    console.log('******** Mongoose error', err)
});
connection.on('disconnected', () => {
    console.log('******** Mongoose disconnected')
});

/**
 * 以下操作使用原生的接口，具体参考 mongoosejs.com:
 *      find remove insertMany
 */

export interface IOgmsModel {
    findByPages(where, pageOpt);
    findByIds(ids);
    findByUserId(userId);
    insert(doc);
    upsert(where, update, options?);
}
export const OgmsSchemaStatics = {
    findByIds: async function (ids) {
        try {
            return Bluebird.map(ids, id => this.findById(id));
        }
        catch (e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    },

    /**
     * 分页查询
     * @return
     *      {
     *          count: number,
     *          docs: any[]
     *      }
     */
    findByPages: async function (where, pageOpt: {
        pageSize: number,
        pageIndex: number
    }) {
        try {
            let [count, docs] = await Bluebird.all([
                this.countDocuments(),
                this
                    .find(where)
                    .sort({ _id: -1 })
                    .limit(pageOpt.pageSize)
                    .skip(pageOpt.pageSize * (pageOpt.pageIndex - 1))
            ])
            return { count, docs };
        }
        catch (e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    },
    
    /**
     * 查询用户相关的数据 包括用户创建和用户订阅的
     * @return
     *      {
     *          count: number,
     *          docs: any[]
     *      }
     */
    findByUserId: async function (userId) {
        try {
            let docs = await this.find().or([
                {
                    "auth.userId": userId
                },
                {
                    subscribed_uids: {
                        $in: [userId]
                    }
                }
            ]).sort({ _id: -1 })
            return { docs }
        }
        catch (e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    },

    upsert: async function (where, update, options?) {
        try {
            !!options || (options = {})
            options.upsert = true;
            return this.updateOne(where, update, options)
        }
        catch (e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    },

    insert: async function (item) {
        try {
            let queryId
            if (item._id) {
                queryId = item._id;
            }
            else {
                queryId = new ObjectID();
                item._id = queryId;
            }
            return this.updateOne({ _id: queryId }, item, { upsert: true })
                .then(rst => {
                    return item
                })
        }
        catch (e) {
            console.error(e)
            return Bluebird.reject(e)
        }
    },
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