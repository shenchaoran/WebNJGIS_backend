import {
    commentDB,
    conversationDB,
    Comment,
    Conversation,
    userDB
} from '../models';
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
                docs: conversation.comments.slice((pageIndex-1)*pageSize, pageIndex*pageSize),
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
                    comments: {_id: commentId}
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
     *      commentCount: number,
     *      comments: Comment[],
     * }
     */
    findOne(cid) {
        return Promise.all([
            conversationDB.findOne({ _id: cid })
                .then(conversation => {
                    return userDB.findDocs(conversation.participants)
                        .then(users => {
                            return {
                                conversation,
                                users
                            };
                        })
                }),
            commentDB.findByPage({
                cid: cid
            }, {
                    pageIndex: 1,
                    pageSize: 20
                })
        ])
            .then(([
                {
                    conversation,
                    users
                },
                {
                    count: commentCount,
                    docs: comments
                }
            ]) => {
                return {
                    conversation,
                    users,
                    comments,
                    commentCount
                };
            })
    }

    /**
     * @return{ docs, count }
     */
    findByPage(pageIndex, pageSize) {
        return conversationDB.findByPage({}, {pageSize, pageIndex});
    }

    /**
     * @return true/false
     */
    addConversation(conversation) {
        return conversationDB.insert(conversation)
            .then(v => true)
            .catch(e => {
                console.log(e);
                return false;
            });
    }
}