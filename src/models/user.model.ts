import { MongooseModel } from './mongodb.model';

class UserModel extends MongooseModel {
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

export const UserModelInstance = new UserModel();

export class UserClass {
    username: string;
    password: string;
    email?: string;
}