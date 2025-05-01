import {articlesCollection, ArticleType} from "../db/db";

export const articlesRepository = {
    async findArticles(title: string | null | undefined): Promise<ArticleType[]> {
        const filter: any = {}
        if (title) {
            filter.title = {$regex: title}
        }
        return articlesCollection.find(filter).toArray()
    },

    async findArticleById(id: number): Promise<ArticleType | null> {
        let article: ArticleType | null = await articlesCollection.findOne({
            id: id
        })
        return (article)
    },

    async createArticle(newArticle: ArticleType): Promise<ArticleType> {
        await articlesCollection.insertOne(newArticle)
        return (newArticle)
    },

    async updateArticle(id: number, updateData): Promise<boolean> {
        const updatedArticle = await articlesCollection.updateOne({id: id}, {$set: updateData})
        return !!updatedArticle.matchedCount;
    },

    async deleteArticle(id: number): Promise<boolean> {
        const deleteSuccess = await articlesCollection.deleteOne({id: id})
        return !!deleteSuccess;
    }
}