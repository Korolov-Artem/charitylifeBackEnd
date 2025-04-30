import express, {Response} from "express";
import {RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithQuery} from "../types";
import {ArticlesQueryModel} from "../models/ArticlesQueryModel";
import {ArticleViewModel} from "../models/ArticleViewModel";
import {ArticleURIParamsIdModel} from "../models/ArticleURIParamsIdModel";
import {ArticleCreateModel} from "../models/ArticleCreateModel";
import {ArticleUpdateModel} from "../models/ArticleUpdateModel";
import {ArticleType} from "../db/db";
import {articlesRepository} from "../repositories/articles-db-repository";
import {body, matchedData, param} from "express-validator";
import {ArticleErrorsModel} from "../models/ArticleErrorsModel";
import {inputValidationMiddleware} from "../middlewares/inputValidationMiddleware";

const articlePostValidation = [body("title").trim().isLength({min: 1, max: 300}).withMessage(
    "Title length has to be no less than 1 symbol and no more than 300 symbols.").escape(),
    body("content").trim().notEmpty().withMessage("Content is required").escape(),
    body("theme").trim().notEmpty().withMessage("Theme is required").escape(),
]

const titleValidation = body("title").trim().isLength({min: 1, max: 300}).withMessage(
    "Title length has to be no less than 1 symbol and no more than 300 symbols.").escape()

const articleUpdateValidation = [
    param("id").notEmpty().withMessage("id is required").isInt().withMessage("id should be a valid number"),
    body("title").optional().trim().isLength({min: 1}),
    body("theme").optional().trim().isLength({min: 1}),
    body("content").optional().trim().isLength({min: 1}),
]

export const ArticleGetViewModel = (dbArticle: ArticleType):
    ArticleViewModel => {
    return {
        id: dbArticle.id,
        title: dbArticle.title
    }
}

export const getArticlesRoutes = () => {

    const router = express.Router()

    router.get('/', async (req: RequestWithQuery<ArticlesQueryModel>,
                           res: Response<ArticleViewModel[]>) => {
        const foundArticlesPromise: Promise<ArticleType[]> = articlesRepository.findArticles(
            req.query.title?.toString())

        const foundArticles: ArticleType[] = await foundArticlesPromise
        res.status(200).json(foundArticles.map(ArticleGetViewModel))
    })

    router.get('/:id', async (req: RequestWithParams<ArticleURIParamsIdModel>,
                              res: Response<ArticleViewModel>) => {
        const foundArticlePromise: Promise<ArticleType | null> = articlesRepository
            .findArticleById(+req.params.id)
        const foundArticle: ArticleType | null = await foundArticlePromise
        if (foundArticle) {
            res.status(200).json(ArticleGetViewModel(foundArticle))
        } else {
            res.sendStatus(404)
        }
    })

    router.post('/', articlePostValidation, inputValidationMiddleware,
        async (req: RequestWithBody<ArticleCreateModel>,
               res: Response<ArticleViewModel | ArticleErrorsModel>) => {
            const data = matchedData(req)
            const createdArticlePromise: Promise<ArticleType> = articlesRepository.createArticle(
                data.title, data.content, data.theme
            )
            const createdArticle: ArticleType = await createdArticlePromise
            res.status(201).json(ArticleGetViewModel(createdArticle))
        })

    router.put('/:id', articleUpdateValidation, inputValidationMiddleware,
        async (req: RequestWithParamsAndBody<{ id: string }, ArticleUpdateModel>,
               res: Response<ArticleViewModel | ArticleErrorsModel>) => {
            const data = matchedData(req)

            if (!data.title && !data.theme && !data.content) {
                res.status(400).send({errors: [{msg: "At least one field must be provided"}]})
                return
            }

            const updatedData = {
                ...(data.title && {title: data.title}),
                ...(data.theme && {theme: data.theme}),
                ...(data.content && {content: data.content}),
            }

            const updatedArticleStatus: boolean = await articlesRepository.updateArticle(+data.id, updatedData)
            if (updatedArticleStatus) {
                const updatedArticle: ArticleType | null = await articlesRepository
                    .findArticleById(+data.id)
                if (updatedArticle) {
                    res.status(200).json(ArticleGetViewModel(updatedArticle))
                } else {
                    res.sendStatus(404)
                }
            } else {
                res.sendStatus(404)
            }
        })

    router.delete('/:id', async (req: RequestWithParams<{ id: string }>,
                                 res: Response) => {
        const deleteSuccessPromise: Promise<boolean> = articlesRepository.deleteArticle(+req.params.id)
        const deleteSuccess: true | false = await deleteSuccessPromise
        if (deleteSuccess) {
            res.sendStatus(204)
        } else {
            res.sendStatus(404)
        }
    })

    return router
}