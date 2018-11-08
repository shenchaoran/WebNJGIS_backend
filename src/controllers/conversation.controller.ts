import {
    commentDB,
    conversationDB,
    Comment,
    Conversation,
    userDB,
    solutionDB,
    taskDB,
    calcuTaskDB,
    modelServiceDB,
    topicDB,
} from '../models';
import * as Bluebird from 'bluebird';
import { ObjectID } from 'mongodb';

export default class ConversationCtrl {
    constructor() {

    }

    /**
     * @return { count, docs }
     */
    getCommentsByPage(cid, pageIndex, pageSize) {
        return conversationDB.findOne({
            cid: cid
        })
            .then(conversation => {
                return {
                    docs: conversation.comments.slice((pageIndex - 1) * pageSize, pageIndex * pageSize),
                    count: conversation.comments.length
                };
            });
    }

    /**
     * @return true/false
     */
    addComment(cid, comment: Comment) {
        comment.cid = cid;
        return conversationDB.update(
            {
                _id: cid
            },
            {
                $push: {
                    comments: comment
                }
            }
        )
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    updateComment(cid, comment: Comment) {
        return conversationDB.update(
            {
                _id: cid,
                comments: {
                    $elemMatch: {
                        _id: comment._id
                    }
                }
            },
            {
                $set: {
                    'comments.$': comment
                }
            }
        )
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    /**
     * @return true/false
     */
    deleteComment(cid, commentId) {
        return conversationDB.update(
            {
                _id: cid
            },
            {
                $pull: {
                    comments: { _id: commentId }
                }
            }
        )
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            })
    }

    /**
     * @return { 
     *      conversation,
     *      users: User[],
     *      commentCount: number,       // TODO 一次性返回，暂时先不按分页返回
     * }
     */
    async findOne(where) {
        try {
            let conversation = await conversationDB.findOne(where);
            if (!conversation)
                return {};
            let userIds = new Set();
            conversation.comments.map(v => userIds.add(v.from_uid));
            let users = await userDB.findByIds(Array.from(userIds));
            users.map(user => user.password = null);
            return {
                conversation,
                users,
                commentCount: conversation.comments.length
            };
        }
        catch (e) {
            console.log(e)
            return Bluebird.reject(e);
        }
    }

    /**
     * @return{ docs, count }
     */
    findByPage(pageOpt) {
        return conversationDB.findByPage({}, pageOpt);
    }

    /**
     * @return true/false
     */
    async addConversation(conversation) {
        try {
            let pDB;
            switch (conversation.ptype) {
                case 'solution':
                    pDB = solutionDB;
                    break;
                case 'task':
                    pDB = taskDB;
                    break;
                case 'calcuTask':
                    pDB = calcuTaskDB;
                    break;
                case 'ms':
                    pDB = modelServiceDB;
                    break;
                case 'topic':
                    pDB = topicDB;
                    break;
            }
            await Bluebird.all([
                conversationDB.insert(conversation),
                pDB.update({ _id: conversation.pid }, {
                    $set: {
                        conversationId: conversation._id
                    }
                }),
            ]);
            return true;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
}