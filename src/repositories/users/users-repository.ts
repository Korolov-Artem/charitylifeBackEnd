import {UserDBModel} from "../../models/users/UserDBModel";
import {usersCollection} from "../../db/db";
import {DeleteResult} from "mongodb";

export const usersRepository = {
    async createUser(newUser: UserDBModel): Promise<string> {
        await usersCollection.insertOne(newUser);
        return (newUser.id)
    },
    async updateConfirmation(id: string): Promise<boolean> {
        let result = await usersCollection.updateOne({id},
            {$set: {"emailConfirmation.isConfirmed": true}});
        return result.modifiedCount === 1
    },
    async updateConfirmationCode(id: string, confirmationCode: string): Promise<boolean> {
        let result = await usersCollection.updateOne({id},
            {$set: {"emailConfirmation.confirmationCode": confirmationCode}});
        return result.modifiedCount === 1
    },
    async updateSentEmailConfirmationsById(id: string) {
        await usersCollection.updateOne(
            {id, "emailConfirmation.sentEmails": {$exists: false}},
            {$set: {"emailConfirmation.sentEmails": []}}
        )

        return await usersCollection.updateOne(
            {id},
            {
                $push: {
                    "emailConfirmation.sentEmails": {sentDate: new Date()}
                }
            }
        )
    },
    async findUserByEmail(email: string): Promise<UserDBModel | null> {
        return await usersCollection.findOne({"accountData.email": email});
    },
    async findUserById(id: string): Promise<UserDBModel | null> {
        return await usersCollection.findOne({id: id});
    },
    async findRecentUsersByIp(ip: string): Promise<UserDBModel[]> {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        return await usersCollection.find({
            "registrationData.ip": ip,
            "accountData.createdAt": {$gte: fiveMinutesAgo}
        }).toArray()
    },
    async findRecentUserConfirmationEmailsById(id: string): Promise<UserDBModel | null> {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        return await usersCollection.findOne({
            id: id,
            "emailConfirmation.sentEmails": {
                $elemMatch: {
                    "sentDate": {$gte: fiveMinutesAgo}
                }
            }
        })
    },
    async deleteUserById(id: string): Promise<DeleteResult> {
        return await usersCollection.deleteOne({id: id})
    }
}