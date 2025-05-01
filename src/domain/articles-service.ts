import {ArticleType} from "../db/db";
import {articlesRepository} from "../repositories/articles-db-repository";

export const articlesService = {
    async findArticles(title: string | null | undefined): Promise<ArticleType[]> {
        return await articlesRepository.findArticles(title)
    },

    async findArticleById(id: number): Promise<ArticleType | null> {
        return await articlesRepository.findArticleById(id)
    },

    async createArticle(title: string, content: string,
                        theme: string): Promise<ArticleType> {
        const newDate = new Date()
        const formattedDate = newDate.toLocaleDateString("en-GB")
        const newArticle: ArticleType = {
            id: +(new Date()), title: title,
            content: content, theme: theme, dataPublished: formattedDate, author: "Gene Korolov"
        }
        return await articlesRepository.createArticle(newArticle)
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