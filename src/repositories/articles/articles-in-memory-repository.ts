import {ArticleType, memoryDB} from "../../db/db";

export const articlesRepository = {
    async findArticles(title: string | null | undefined): Promise<ArticleType[]> {
        if (title) {
            return memoryDB.articles.filter(
                (a) => a.title.toLowerCase().indexOf(title.toLowerCase()) > -1
            );
        }

        return memoryDB.articles;
    },
    async findArticleById(id: number): Promise<ArticleType | undefined> {
        let article: ArticleType | undefined = memoryDB.articles.find(
            (a) => a.id === id
        );
        return article;
    },
    async createArticle(
        title: string,
        content: string,
        theme: string,
        synopsis: string,
        image: string,
        imageCredits: string,
    ): Promise<ArticleType> {
        const newDate = new Date();
        const formattedDate = new Date();
        const newArticle: ArticleType = {
            id: +new Date(),
            title: title,
            content: content,
            theme: theme,
            synopsis: synopsis,
            dataPublished: formattedDate,
            author: "Gene Korolov",
            image: image,
            imageCredits: imageCredits
        };
        memoryDB.articles.push(newArticle);
        return newArticle;
    },
    async updateArticle(
        id: number,
        title: string
    ): Promise<ArticleType | undefined> {
        const updatedArticle: ArticleType | undefined = memoryDB.articles.find(
            (a) => a.id === id
        );
        if (updatedArticle) {
            updatedArticle.title = title;
        }
        return updatedArticle;
    },
    async deleteArticle(id: number): Promise<boolean> {
        for (let i = 0; i < memoryDB.articles.length; i++) {
            if (memoryDB.articles[i].id === id) {
                memoryDB.articles.splice(i, 1);
                return true;
            }
        }
        return false;
    },
};
