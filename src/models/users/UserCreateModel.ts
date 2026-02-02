export type UserCreateModel = {
    email: string,
    password: string,
    userName: string,
    role: "user" | "admin"
}