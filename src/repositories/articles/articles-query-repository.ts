import {articlesCollection, ArticleType} from "../../db/db";
import {Sort} from "mongodb";

export const articlesQueryRepository = {
    async findArticles(title: string | null | undefined, pgNumber = 1,
                       pgSize = 10, sortingOrder: Sort): Promise<ArticleViewModel[]> {
        const filter: any = {}
        if (title) {
            filter.title = {$regex: title}
        }
        const skip = (pgNumber - 1) * pgSize

        const articles = await articlesCollection.find(filter)
            .skip(skip).limit(pgSize).sort(sortingOrder).toArray()

        return articles.map(article => {
            return this._mapArticleToArticleViewModel(article)
        })
    },

    async findArticleById(id: number): Promise<ArticleViewModel | null> {
        if (id) {
            const article = await articlesCollection.findOne({
                id: id
            })
            return article ? this._mapArticleToArticleViewModel(article) : null
        }
        return null

    },

    _mapArticleToArticleViewModel(article: ArticleType): ArticleViewModel {
        return {
            id: article.id,
            title: article.title,
            theme: article.theme,
            dataPublished: article.dataPublished,
            author: article.author,
            synopsis: article.synopsis
        }
    }
}

type ArticleViewModel = {
    id: number
    title: string
    theme: string
    dataPublished: string
    author: string
    synopsis: string
}