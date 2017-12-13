import { Mongoose } from './mongoose.base';
import * as mongoose from 'mongoose';

class UserDB extends Mongoose {
    constructor() {
        const collectionName = 'User';
        const schema = {
            username: String,
            password: String,
            email: String
        };

        super(collectionName, schema);
    }
}

export const userDB = new UserDB();

export class UserClass {
    _id?: mongoose.Schema.Types.ObjectId
    username: string;
    password: string;
    email?: string;
}