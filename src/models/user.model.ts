import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class UserDB extends Mongoose {
    constructor() {
        const collectionName = 'User';
        const schema = {
            username: String,
            password: String,
            email: String,
            avator: String
        };

        super(collectionName, schema);
    }
}

export const userDB = new UserDB();

export class User {
    _id?: any
    username: string;
    password: string;
    email?: string;
    avator: string;
}