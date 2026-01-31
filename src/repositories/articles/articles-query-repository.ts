import {articlesCollection, ArticleType} from "../../db/db";
import {Sort} from "mongodb";

export const articlesQueryRepository = {
    async findArticles(
        title: string | null | undefined,
        pgNumber = 1,
        pgSize = 10,
        sortingOrder: Sort
    ): Promise<ArticleViewModel[]> {
        const filter: any = {};
        if (title) {
            filter.title = {$regex: title};
        }
        const skip = (pgNumber - 1) * pgSize;

        const articles = await articlesCollection
            .find(filter)
            .skip(skip)
            .limit(pgSize)
            .sort(sortingOrder)
            .toArray();

        return articles.map((article) => {
            return this._mapArticleToArticleViewModel(article);
        });
    },

    async findArticleById(id: number): Promise<ArticleViewModel | null> {
        if (id) {
            const article: ArticleType | null = await articlesCollection.findOne({
                id: id,
            });
            return article ? this._mapArticleToArticleViewModel(article) : null;
        }
        return null;
    },

    async findArticlesByTheme(theme: string | undefined, page: number = 1): Promise<PaginatedArticlesViewModel> {
        const pageSize = 6
        if (theme) {
            const itemsToSkip: number = pageSize * (page - 1)
            const rawArticles: ArticleType[] = await articlesCollection
                .find({theme: theme})
                .sort({dataPublished: -1})
                .skip(itemsToSkip)
                .limit(pageSize + 1)
                .toArray()

            const hasMore = rawArticles.length > pageSize
            const articles = hasMore ? rawArticles.slice(0, pageSize) : rawArticles;

            return {
                articles: articles.map(article => this._mapArticleToArticleViewModel(article)),
                hasMore: hasMore
            }
        }
        return {articles: [], hasMore: false}
    },

    _mapArticleToArticleViewModel(article: ArticleType): ArticleViewModel {
        return {
            id: article.id,
            title: article.title,
            theme: article.theme,
            dataPublished: article.dataPublished,
            author: article.author,
            synopsis: article.synopsis,
            image: article.image,
            content: article.content,
            imageCredits: article.imageCredits,
        };
    },
};

type ArticleViewModel = {
    id: number;
    title: string;
    theme: string;
    dataPublished: Date;
    author: string;
    synopsis: string;
    image: string;
    content: string
    imageCredits: string;
};

export type PaginatedArticlesViewModel = {
    articles: ArticleViewModel[];
    hasMore: boolean;
}