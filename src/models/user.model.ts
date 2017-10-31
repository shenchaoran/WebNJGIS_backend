import { MongooseModel } from './mongodb.model';

class UserModel extends MongooseModel {
    constructor() {
        const collectionName = 'User';
        const schema = {
            username: String,
            passport: String,
            email: String
        };

        super(collectionName, schema);
    }
}

export const UserModelInstance = new UserModel();

export class UserClass {
    username: string;
    passport: string;
    email?: string;
}