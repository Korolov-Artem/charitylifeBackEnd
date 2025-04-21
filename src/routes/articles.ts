import express, {Response} from "express";
import {RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithQuery} from "../types";
import {ArticlesQueryModel} from "../models/ArticlesQueryModel";
import {ArticleViewModel} from "../models/ArticleViewModel";
import {ArticleURIParamsIdModel} from "../models/ArticleURIParamsIdModel";
import {ArticleCreateModel} from "../models/ArticleCreateModel";
import {ArticleUpdateModel} from "../models/ArticleUpdateModel";
import {ArticleType} from "../db/db";
import {articlesRepository} from "../repositories/articles-repository";
import {body, matchedData} from "express-validator";
import {ArticleErrorsModel} from "../models/ArticleErrorsModel";
import {inputValidationMiddleware} from "../middlewares/inputValidationMiddleware";

const titleValidation = body("title").trim().isLength({min: 1, max: 300}).withMessage(
    "Title length has to be no less than 1 symbol and no more than 300 symbols.").escape()

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

    router.post('/', titleValidation, inputValidationMiddleware, (req: RequestWithBody<ArticleCreateModel>,
                                                                  res: Response<ArticleViewModel | ArticleErrorsModel>) => {
        const data = matchedData(req)
        const createdArticle = articlesRepository.createArticle(
            data.title, data.content, data.theme
        )
        res.status(201).json(ArticleGetViewModel(createdArticle))
    })

    router.put('/:id', titleValidation, inputValidationMiddleware, (req: RequestWithParamsAndBody<{ id: string },
                                                                        ArticleUpdateModel>,
                                                                    res: Response<ArticleViewModel | ArticleErrorsModel>) => {
        const data = matchedData(req)
        const updatedArticle = articlesRepository.updateArticle(
            +data.id, data.title)
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