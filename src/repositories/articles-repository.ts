import {ArticleType, db} from "../db/db";

export const articlesRepository = {
    findArticles(title: string | null | undefined) {
        if (title) {
            return (db.articles.filter(a =>
                a.title.toLowerCase().indexOf(title.toLowerCase()) > -1))
        }

        return (db.articles)
    },
    findArticleById(id: number) {
        let article = db.articles.find(
            a => a.id === id)
        return (article)
    },
    createArticle(title: string, content: string,
                  theme: string) {
        const newDate = new Date()
        const formattedDate = newDate.toLocaleDateString("en-GB")
        const newArticle: ArticleType = {
            id: +(new Date()), title: title,
            content: content, theme: theme, dataPublished: formattedDate, author: "Gene Korolov"
        }
        db.articles.push(newArticle)
        return (newArticle)
    },
    updateArticle(id: number, title: string) {
        const updatedArticle = db.articles.find(a => a.id === id)
        if (updatedArticle) {
            updatedArticle.title = title
        }
        return (updatedArticle)
    },
    deleteArticle(id: number) {
        for (let i = 0; i < db.articles.length; i++) {
            if (db.articles[i].id === id) {
                db.articles.splice(i, 1)
                return true;
            }
        }
    }
}