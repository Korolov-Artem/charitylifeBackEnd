import {ArticleType} from "../db/db";
import {articlesRepository} from "../repositories/articles/articles-db-repository";
import he from "he";

export const articlesService = {
    async createArticle(
        title: string,
        content: string,
        theme: string,
        synopsis: string,
        image: string,
        imageCredits: string
    ): Promise<number> {
        const dataPublished = new Date();
        const decodedImage = he.decode(image)
        const newArticle: ArticleType = {
            id: +new Date(),
            title: title,
            content: content,
            theme: theme,
            synopsis: synopsis,
            dataPublished: dataPublished,
            author: "Gene Korolov",
            image: decodedImage,
            imageCredits: imageCredits,
        };
        const createdArticle: ArticleType = await articlesRepository.createArticle(
            newArticle
        );
        return createdArticle.id;
    },

    async updateArticle(
        id: number,
        updateData: Partial<{
            title: string;
            theme: string;
            content: string;
        }>
    ): Promise<boolean> {
        return await articlesRepository.updateArticle(id, updateData);
    },

    async deleteArticle(id: number): Promise<boolean> {
        return await articlesRepository.deleteArticle(id);
    },
};
