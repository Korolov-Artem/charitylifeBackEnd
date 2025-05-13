import {articlesCollection, ArticleType} from "../../db/db";

export const articlesRepository = {
    async createArticle(newArticle: ArticleType): Promise<ArticleType> {
        await articlesCollection.insertOne(newArticle)
        return (newArticle)
    },

    async updateArticle(id: number, updateData: Partial<{
        title: string,
        theme: string,
        content: string
    }>): Promise<boolean> {
        const updatedArticle = await articlesCollection
            .updateOne({id: id}, {$set: updateData})
        return !!updatedArticle.matchedCount;
    },

    async deleteArticle(id: number): Promise<boolean> {
        const deleteSuccess = await articlesCollection.deleteOne({id: id})
        return !!deleteSuccess;
    }
}