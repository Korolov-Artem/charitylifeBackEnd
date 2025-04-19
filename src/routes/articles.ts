import express, {Response} from "express";
import {RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithQuery} from "../types";
import {ArticlesQueryModel} from "../models/ArticlesQueryModel";
import {ArticleViewModel} from "../models/ArticleViewModel";
import {ArticleURIParamsIdModel} from "../models/ArticleURIParamsIdModel";
import {ArticleCreateModel} from "../models/ArticleCreateModel";
import {ArticleUpdateModel} from "../models/ArticleUpdateModel";
import {ArticleType} from "../db/db";
import {articlesRepository} from "../repositories/articles-repository";
import {body, matchedData, validationResult} from "express-validator";
import {ArticleErrorsModel} from "../models/ArticleErrorsModel";

export const ArticleGetViewModel = (dbArticle: ArticleType):
    ArticleViewModel => {
    return {
        id: dbArticle.id,
        title: dbArticle.title
    }
}

export const getArticlesRoutes = () => {

    const router = express.Router()

    router.get('/', (req: RequestWithQuery<ArticlesQueryModel>,
                     res: Response<ArticleViewModel[]>) => {
        const foundArticles = articlesRepository.findArticles(
            req.query.title?.toString())

        res.status(200).json(foundArticles.map(ArticleGetViewModel))
    })

    router.get('/:id', (req: RequestWithParams<ArticleURIParamsIdModel>,
                        res: Response<ArticleViewModel>) => {
        const foundArticle = articlesRepository
            .findArticleById(+req.params.id)
        if (foundArticle) {
            res.status(200).json(ArticleGetViewModel(foundArticle))
        } else {
            res.sendStatus(404)
        }
    })

    router.post('/', body("title").notEmpty().escape(), (req: RequestWithBody<ArticleCreateModel>,
                                                         res: Response<ArticleViewModel | ArticleErrorsModel>) => {
        const result = validationResult(req)
        if (result.isEmpty()) {
            const data = matchedData(req)
            const createdArticle = articlesRepository.createArticle(
                data.title, data.content, data.theme
            )
            res.status(201).json(ArticleGetViewModel(createdArticle))
            return;
        }
        res.status(400).send({
            errors: result.array().map(err => ({
                field: (err as any).path || "unknown",
                message: err.msg
            }))
        })
    })

    router.put('/:id', (req: RequestWithParamsAndBody<{ id: string },
                            ArticleUpdateModel>,
                        res: Response<ArticleViewModel>) => {
        const updatedArticle = articlesRepository.updateArticle(
            +req.params.id, req.body.title)
        if (updatedArticle) {
            res.status(200).json(ArticleGetViewModel(updatedArticle))
        } else {
            res.sendStatus(404)
        }
    })

    router.delete('/:id', (req: RequestWithParams<{ id: string }>,
                           res: Response) => {
        const deleteSuccess = articlesRepository.deleteArticle(+req.params.id)
        if (deleteSuccess) {
            res.sendStatus(204)
        } else {
            res.sendStatus(404)
        }
    })

    return router
}