import {ArticleType, client} from "../db/db";

export const articlesRepository = {
    async findArticles(title: string | null | undefined): Promise<ArticleType[]> {
        if (title) {
            return client.db("charitylife").collection<ArticleType>("articles").find({
                title: {$regex: title}
            }).toArray()
        } else {
            return client.db("charitylife").collection<ArticleType>("articles").find().toArray()
        }
    },

    async findArticleById(id: number): Promise<ArticleType | null> {
        let article: ArticleType | null = await client.db("charitylife")
            .collection<ArticleType>("articles").findOne({
                id: id
            })
        return (article)
    },

    async createArticle(title: string, content: string,
                        theme: string): Promise<ArticleType> {
        const newDate = new Date()
        const formattedDate = newDate.toLocaleDateString("en-GB")
        const newArticle: ArticleType = {
            id: +(new Date()), title: title,
            content: content, theme: theme, dataPublished: formattedDate, author: "Gene Korolov"
        }
        await client.db("charitylife").collection<ArticleType>("articles")
            .insertOne(newArticle)
        return (newArticle)
    },

    async updateArticle(id: number, updateData: Partial<{
        title: string,
        theme: string,
        content: string
    }>): Promise<boolean> {
        const updatedArticle = await client.db("charitylife")
            .collection("articles").updateOne({id: id}, {$set: updateData})
        return !!updatedArticle.matchedCount;
    },

    async deleteArticle(id: number): Promise<boolean> {
        const deleteSuccess = await client.db("charitylife")
            .collection("articles").deleteOne({id: id})
        return !!deleteSuccess;
    }
}