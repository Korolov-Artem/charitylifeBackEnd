import bcrypt from 'bcrypt';
import {UserDBModel} from "../models/users/UserDBModel";
import {ObjectId} from "mongodb";
import {usersRepository} from "../repositories/users/users-repository";

export const usersService = {
    async createUser(email: string, password: string): Promise<string> {
        const passwordHash = await this._generateHash(password, 10);

        const newUser: UserDBModel = {
            id: new ObjectId().toString(),
            email,
            passwordHash,
            createdAt: new Date()
        }

        return await usersRepository.createUser(newUser);
    },

    async checkCredentials(email: string, password: string) {
        const user = await usersRepository.findUserByEmail(email);
        if (!user) return false;
        const result = await bcrypt.compare(password, user.passwordHash);
        if (result) {
            return user
        } else {
            return false;
        }
    },

    async _generateHash(password: string, salt: number) {
        return await bcrypt.hash(password, salt)
    },

    async findUserById(id: string) {
        return await usersRepository.findUserById(id)
    }
}