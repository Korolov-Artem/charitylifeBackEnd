export type UserDBModel = {
    id: string,
    accountData: {
        userName: string,
        email: string,
        passwordHash: string,
        refreshToken?: string
        passwordResetCode?: string,
        recentPasswordReset?: recentPasswordReset[],
        createdAt: Date,
    },
    emailConfirmation: {
        confirmationCode: string,
        expirationDate: Date,
        isConfirmed: boolean,
        sentEmails?: sentEmailType[]
    },
    registrationData: {
        ip: string
    }
}

type sentEmailType = {
    sentDate: Date
}

type recentPasswordReset = {
    resetDate: Date
}