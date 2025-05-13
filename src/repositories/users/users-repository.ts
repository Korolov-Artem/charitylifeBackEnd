import {UserDBModel} from "../../models/users/UserDBModel";
import {usersCollection} from "../../db/db";

export const usersRepository = {
    async createUser(newUser: UserDBModel) {
        await usersCollection.insertOne(newUser);
        return (newUser.id)
    },
    async findUserByEmail(email: string): Promise<UserDBModel | null> {
        return await usersCollection.findOne({email: email});
    },
    async findUserById(id: string): Promise<UserDBModel | null> {
        return await usersCollection.findOne({id: id});
    }
}