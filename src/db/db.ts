import {MongoClient} from "mongodb";
import {UserDBModel} from "../models/users/UserDBModel";
import {ReactionDBModel} from "../models/reactions/ReactionDBModel";

export type ArticleType = {
    id: number;
    title: string;
    content: string;
    theme: string;
    synopsis: string;
    dataPublished: Date;
    author: string;
    image: string;
    imageCredits: string;
};

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017";

const client = new MongoClient(mongoURI);
const db = client.db("charitylife");

export const articlesCollection = db.collection<ArticleType>("articles");
export const usersCollection = db.collection<UserDBModel>("users");
export const reactionsCollection = db.collection<ReactionDBModel>("reactions");

export async function runDB() {
    try {
        await client.connect();
        await client.db("charitylife").command({ping: 1});
        console.log("Successfully connected to mongo server");
    } catch {
        await client.close();
        console.log("Error connecting to mongo server");
    }
}

export const memoryDB: { articles: ArticleType[] } = {
    articles: [
        {
            id: 1,
            title: "New Health",
            content: "<h1>Hello World</h1>",
            theme: "Medicine",
            dataPublished: new Date(),
            author: "Gene Korolov",
            synopsis: "",
            image: "",
            imageCredits: ""
        },
    ],
};

export type DBType = { articles: ArticleType[] };
