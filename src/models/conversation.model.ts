import { Mongoose } from './mongoose.base';
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
        };

        super(collectionName, schema);
    }
}

export const conversationDB = new ConversationDB();

export class Conversation {
    _id?: any;
    pid: string;
    ptype: 'topic' | 'task' | 'solution' | 'calcuTask' | 'ms';
    // 点赞
    like_uids: string[];
    // 收藏
    love_uids: string[];
    tags: (string | 'TOP' | 'HOT')[];
    comments: Comment[];
}

export class Comment {
    _id?: any;
    // 编辑的历史
    content: {
        time: number,
        html: string,
        md: string,
        state?: CommentState
    }[];
    // 版本号
    svid: number;
    from_uid: string;
    anonymous: boolean;
    // 可以为空，表示不是回复评论
    to_uid?: string;
    // @ 的用户
    notified_uids?: string[];
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

export enum CommentState {
    WRITE = 'WRITE',
    READ = 'READ'
}