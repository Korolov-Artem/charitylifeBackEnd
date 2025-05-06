import {ArticleType} from "../db/db";
import {articlesRepository} from "../repositories/articles-db-repository";

export const articlesService = {
    async createArticle(title: string, content: string,
                        theme: string, synopsis: string): Promise<number> {
        const newDate = new Date()
        const formattedDate = newDate.toLocaleDateString("en-GB")
        const newArticle: ArticleType = {
            id: +(new Date()), title: title,
            content: content, theme: theme, synopsis: synopsis,
            dataPublished: formattedDate, author: "Gene Korolov"
        }
        const createdArticle: ArticleType = await articlesRepository.createArticle(newArticle)
        return (createdArticle.id)
    },

    async updateArticle(id: number, updateData: Partial<{
        title: string,
        theme: string,
        content: string
    }>): Promise<boolean> {
        return await articlesRepository.updateArticle(id, updateData)
    },

    async deleteArticle(id: number): Promise<boolean> {
        return await articlesRepository.deleteArticle(id)
    }
}