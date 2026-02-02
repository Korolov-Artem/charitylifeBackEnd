import {RefreshTokenMeta, UserDBModel} from "../../models/users/UserDBModel";
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
    async resetPasswordWithATemporaryCode(id: string, passwordResetCode: string): Promise<boolean> {
        let result = await usersCollection.updateOne(
            {id},
            {$set: {"accountData.passwordResetCode": passwordResetCode}}
        )
        return result.modifiedCount === 1
    },
    async updatePassword(id: string, passwordHash: string) {
        let result = await usersCollection.updateOne(
            {id},
            {$set: {"accountData.passwordHash": passwordHash}}
        )
        return result.modifiedCount === 1
    },
    async clearPasswordResetCode(id: string) {
        let result = await usersCollection.updateOne(
            {id},
            {$unset: {"accountData.passwordResetCode": ""}}
        )
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
    async addRecentPasswordResetById(id: string) {
        const newResetEntry = {resetDate: new Date()}
        const result = await usersCollection.updateOne(
            {id},
            {$push: {"accountData.recentPasswordReset": newResetEntry}}
        )
        return !!result;
    },
    async checkRecentPasswordResetById(id: string) {
        const user = await usersCollection.findOne(
            {id},
            {projection: {"accountData.recentPasswordReset": 1}}
        )
        if (!user) return false

        if (!user.accountData.recentPasswordReset || !Array.isArray(
            user.accountData.recentPasswordReset)) return true
        if (user.accountData.recentPasswordReset.length <= 3) return true

        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        // Check if there were 3 recent attempts to change the password
        const allRecent = user.accountData.recentPasswordReset.every(reset => {
            const resetDate = new Date(reset.resetDate)
            return resetDate > threeDaysAgo
        })
        if (allRecent) return false
        if (!allRecent) {
            const result = await usersCollection.updateOne(
                {id},
                {$unset: {"accountData.recentPasswordReset": ""}}
            )
            return result.acknowledged;
        }
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
    },
    async removeOutdatedRefreshToken(id: string, deviceId: string) {
        return await usersCollection.updateOne(
            {id: id},
            {
                $pull: {
                    "accountData.refreshTokensMeta": {
                        deviceId: deviceId
                    }
                }
            }
        )
    },
    async updateRefreshTokenMeta(refreshTokenMeta: RefreshTokenMeta, id: string) {
        return await usersCollection.updateOne(
            {id: id},
            {$push: {"accountData.refreshTokensMeta": refreshTokenMeta}}
        )
    },

    async getRecentLoginAttemptsCount(email: string): Promise<number> {
        const user = await usersCollection.findOne(
            {"accountData.email": email},
            {projection: {"accountData.recentLoginAttempts": 1}}
        )

        if (!user || !user.accountData.recentLoginAttempts) return 0

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

        const recentAttempts = user.accountData.recentLoginAttempts.filter(
            (attempt: any) => {
                return new Date(attempt.attemptDate) > fiveMinutesAgo;
            }
        )
        return recentAttempts.length
    },

    async clearRecentLoginsByEmail(email: string): Promise<boolean> {
        const result = await usersCollection.updateOne(
            {"accountData.email": email},
            {$unset: {"accountData.recentLoginAttempts": ""}}
        )
        return !!result;
    },
    async addRecentLoginAttemptByEmail(email: string, attemptDate: Date) {
        const result = await usersCollection.updateOne(
            {"accountData.email": email},
            {$push: {"accountData.recentLoginAttempts": {attemptDate: attemptDate}}}
        )
        return !!result;
    }
}