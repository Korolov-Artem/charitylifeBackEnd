import {ArticleType, db} from "../db/db";

export const articlesRepository = {
    async findArticles(title: string | null | undefined): Promise<ArticleType[]> {
        if (title) {
            return (db.articles.filter(a =>
                a.title.toLowerCase().indexOf(title.toLowerCase()) > -1))
        }

        return (db.articles)
    },
    async findArticleById(id: number): Promise<ArticleType | undefined> {
        let article: ArticleType | undefined = db.articles.find(
            a => a.id === id)
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
        db.articles.push(newArticle)
        return (newArticle)
    },
    async updateArticle(id: number, title: string): Promise<ArticleType | undefined> {
        const updatedArticle: ArticleType | undefined = db.articles.find(a => a.id === id)
        if (updatedArticle) {
            updatedArticle.title = title
        }
        return (updatedArticle)
    },
    async deleteArticle(id: number): Promise<boolean> {
        for (let i = 0; i < db.articles.length; i++) {
            if (db.articles[i].id === id) {
                db.articles.splice(i, 1)
                return true;
            }
        }
        return false
    }
}