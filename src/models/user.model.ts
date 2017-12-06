import { Mongoose } from './mongoose.base';

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
    username: string;
    password: string;
    email?: string;
}