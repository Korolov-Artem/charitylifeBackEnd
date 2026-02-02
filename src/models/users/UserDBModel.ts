export type UserDBModel = {
    id: string,
    accountData: {
        userName: string,
        email: string,
        passwordHash: string,
        refreshTokensMeta?: RefreshTokenMeta[],
        passwordResetCode?: string,
        recentPasswordReset?: recentPasswordReset[],
        createdAt: Date,
        recentLoginAttempts?: recentLoginAttempt[]
    },
    emailConfirmation: {
        confirmationCode: string,
        expirationDate: Date,
        isConfirmed: boolean,
        sentEmails?: sentEmailType[]
    },
    registrationData: {
        ip: string
    },
    role: "user" | "admin"
}

type sentEmailType = {
    sentDate: Date
}

type recentPasswordReset = {
    resetDate: Date
}

export type RefreshTokenMeta = {
    issuedAt: Date,
    deviceId: string,
    userId: string
}

type recentLoginAttempt = {
    attemptDate: Date
}