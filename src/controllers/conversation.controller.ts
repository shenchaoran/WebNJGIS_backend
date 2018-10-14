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
        return commentDB.findByPage({
            cid: cid
        }, {
                pageIndex,
                pageSize
            });
    }

    /**
     * @return _id: string
     *
     */
    addComment(cid, comment: Comment) {
        comment.cid = cid;
        comment._id = new ObjectID();
        return Promise.all([
            commentDB.insert(comment)
                .then(({ _id }) => {
                    return _id;
                }),
            conversationDB.update(
                {
                    _id: cid
                },
                {
                    $push: {
                        comments: comment._id
                    }
                }
            )
        ])
            .then(([doc]) => {
                return doc._id;
            });
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
}