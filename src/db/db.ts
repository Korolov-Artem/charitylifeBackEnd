import {MongoClient} from "mongodb";

export type ArticleType = {
    id: number,
    title: string,
    content: string,
    theme: string,
    dataPublished: string,
    author: string,
}

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017'

export const client = new MongoClient(mongoURI)

export async function runDB() {
    try {
        await client.connect()
        await client.db("charitylife").command({ping: 1})
        console.log("Successfully connected to mongo server")
    } catch {
        await client.close()
        console.log("Error connecting to mongo server")
    }
}

export const memoryDB: { articles: ArticleType[] } = {
    articles: [
        {
            id: 1, title: 'New Health', content: '<h1>Hello World</h1>',
            theme: 'Medicine', dataPublished: '22.10.22', author: 'Gene Korolov',
        },
    ]
}

export type DBType = { articles: ArticleType[] }