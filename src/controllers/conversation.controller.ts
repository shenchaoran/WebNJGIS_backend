import {
    ConversationModel,
    Comment,
    UserModel,
    SolutionModel,
    TaskModel,
    CalcuTaskModel,
    ModelServiceModel,
    TopicModel,
} from '../models';
import * as Bluebird from 'bluebird';

export default class ConversationCtrl {
    constructor() {

    }

    /**
     * @return { count, docs }
     */
    getCommentsByPage(cid, pageIndex, pageSize) {
        return ConversationModel.findOne({
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
        return ConversationModel.updateOne(
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
        return ConversationModel.updateOne(
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
        return ConversationModel.updateOne(
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
            let conversation = await ConversationModel.findOne(where);
            if (!conversation)
                return {};
            let userIds = new Set();
            conversation.comments.map(v => userIds.add(v.from_uid));
            let users = await UserModel.findByIds(Array.from(userIds));
            users.map(user => {
                if (user) {
                    user.password = null
                }
            });
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
    findByPages(pageOpt) {
        return ConversationModel.findByPages({}, pageOpt);
    }

    /**
     * @return true/false
     */
    async addConversation(conversation) {
        try {
            let pDB;
            switch (conversation.ptype) {
                case 'solution':
                    pDB = SolutionModel;
                    break;
                case 'task':
                    pDB = TaskModel;
                    break;
                case 'calcuTask':
                    pDB = CalcuTaskModel;
                    break;
                case 'ms':
                    pDB = ModelServiceModel;
                    break;
                case 'topic':
                    pDB = TopicModel;
                    break;
            }
            await Bluebird.all([
                ConversationModel.insert(conversation),
                pDB.updateOne({ _id: conversation.pid }, {
                    $set: {
                        cid: conversation._id
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