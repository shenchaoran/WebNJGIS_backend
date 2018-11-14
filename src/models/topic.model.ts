/**
 * 比较问题：描述实际遇到的地理问题
 * 
 */

import { ResourceSrc } from './resource.enum';
import {  OgmsSchemaStatics, IOgmsModel } from './mongoose.base';
import { Document, Schema, Model, model } from 'mongoose';

const collectionName = 'Topic';
const schema = new Schema({
    meta: Schema.Types.Mixed,
    cmpCfg: Schema.Types.Mixed,
    auth: Schema.Types.Mixed,
    spatial: Schema.Types.Mixed,
    temporal: Schema.Types.Mixed,
    cid: String,
    subscribed_uids: Array,
}, { collection: collectionName });
Object.assign(schema.statics, OgmsSchemaStatics)
interface ITopicModel extends Model<ITopicDocument>, IOgmsModel {}
export const TopicModel: ITopicModel = model<ITopicDocument, ITopicModel>(collectionName, schema);

export interface ITopicDocument extends Document {
    meta: {
        name: string,
        desc?: string,
        wikiMD?: string,
        wikiHTML?: string,
        time: number
    };
    auth: {
        src: ResourceSrc,
        userId: string,
        userName: string
    };
    spatial: {
        dimension: 'point' | 'polygon' | 'multi-point',
        geojson: any
    };
    temporal: {
        start: number;
        end: number;
        scale: 'YEAR' | 'DAY';
    };
    cid: string;
    subscribed_uids: string[];
}