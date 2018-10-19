import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

import { ResourceSrc } from './resource.enum';

class ConversationDB extends Mongoose {
    constructor() {
        const collectionName = 'Conversation';
        const schema = {
            pid: String,
            like_uids: Array,
            love_uids: Array,
            tags: Array,
            comments: Array,
            participants: Array,
        };

        super(collectionName, schema);
    }
}

export const conversationDB = new ConversationDB();

export class Conversation {
    _id?: any;
    pid: string;
    // 点赞
    like_uids: string[];
    // 收藏
    love_uids: string[];
    tags: (string | 'TOP' | 'HOT')[];
    comments: (string | Comment)[];
    participants: string[];
}

class CommentDB extends Mongoose {
    constructor() {
        const collectionName = 'Comment';
        const schema = {
            content: Array,
            from_uid: String,
            anonymous: Boolean,
            to_uid: String,
            notified_uids: Array,
            cid: String,
            type: String,
            hide_reason: String,
            reactions: Array,
        };

        super(collectionName, schema);
    }
}

export const commentDB = new CommentDB();

export class Comment {
    _id?: any;
    // 编辑的历史
    content: {
        time: number,
        value: string
    }[];
    from_uid: string;
    anonymous: boolean;
    // 可以为空，表示不是回复评论
    to_uid?: string;
    // @ 的用户
    notified_uids?: string[];
    cid: string;
    type: CommentType;
    hideReason?: string;
    // emoji react
    reactions?: {
        name: string,
        count: number
    }[];
}

export enum CommentType {
    MAIN = 'MAIN',
    REPLY = 'REPLY',
    HIDE = 'HIDE'
};