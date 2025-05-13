import express, {Response} from "express";
import {RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithQuery} from "../types";
import {ArticlesQueryModel} from "../models/articles/ArticlesQueryModel";
import {ArticleViewModel} from "../models/articles/ArticleViewModel";
import {ArticleURIParamsIdModel} from "../models/articles/ArticleURIParamsIdModel";
import {ArticleCreateModel} from "../models/articles/ArticleCreateModel";
import {ArticleUpdateModel} from "../models/articles/ArticleUpdateModel";
import {body, matchedData, param} from "express-validator";
import {ArticleErrorsModel} from "../models/articles/ArticleErrorsModel";
import {inputValidationMiddleware} from "../middlewares/inputValidationMiddleware";
import {articlesService} from "../domain/articles-service";
import {articlesQueryRepository} from "../repositories/articles/articles-query-repository";
import {Sort} from "mongodb";

const articlePostValidation = [
    body("title").trim().notEmpty().withMessage("Title cannot be empty").escape(),
    body("content").trim().notEmpty().withMessage("Content cannot be empty").escape(),
    body("theme").trim().notEmpty().withMessage("Theme cannot be empty").escape(),
    body("synopsis").trim().notEmpty().withMessage("Synopsis cannot be empty").escape(),
]

const titleValidation = body("title").trim().isLength({min: 1, max: 300}).withMessage(
    "Title length has to be no less than 1 symbol and no more than 300 symbols.").escape()

const articleUpdateValidation = [
    param("id").notEmpty().withMessage("id is required").isInt().withMessage("id should be a valid number"),
    body("title").optional().trim().isLength({min: 1}),
    body("theme").optional().trim().isLength({min: 1}),
    body("content").optional().trim().isLength({min: 1}),
]

export const getArticlesRoutes = () => {

    const router = express.Router()

    router.get('/', async (req: RequestWithQuery<ArticlesQueryModel>,
                           res: Response<ArticleViewModel[]>) => {
        const sortByNewestDate = (): Sort => ({"dataPublished": 1})

        const foundArticlesPromise: Promise<ArticleViewModel[]> = articlesQueryRepository
            .findArticles(req.query.title?.toString(), +req.query.pgNumber,
                +req.query.pgSize, sortByNewestDate())

        const foundArticles: ArticleViewModel[] = await foundArticlesPromise
        res.status(200).json(foundArticles)
    })

    router.get('/:id', async (req: RequestWithParams<ArticleURIParamsIdModel>,
                              res: Response<ArticleViewModel>) => {
        const foundArticlePromise: Promise<ArticleViewModel | null> = articlesQueryRepository
            .findArticleById(+req.params.id)
        const foundArticle: ArticleViewModel | null = await foundArticlePromise
        if (foundArticle) {
            res.status(200).json(foundArticle)
        } else {
            res.sendStatus(404)
        }
    })

    router.post('/', articlePostValidation, titleValidation, inputValidationMiddleware,
        async (req: RequestWithBody<ArticleCreateModel>,
               res: Response<ArticleViewModel | null | ArticleErrorsModel>) => {
            const data = matchedData(req)
            const createdArticleId: number = await articlesService.createArticle(
                data.title, data.content, data.theme, data.synopsis
            )
            const createdArticle: ArticleViewModel | null = await articlesQueryRepository
                .findArticleById(createdArticleId)
            res.status(201).json(createdArticle)
        })

    router.put('/:id', articleUpdateValidation, titleValidation, inputValidationMiddleware,
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

            const updatedArticleSuccess: boolean = await articlesService
                .updateArticle(+data.id, updatedData)
            if (updatedArticleSuccess) {
                const updatedArticle: ArticleViewModel | null = await articlesQueryRepository
                    .findArticleById(+data.id)
                if (updatedArticle) {
                    res.status(200).json(updatedArticle)
                } else {
                    res.sendStatus(404)
                }
            } else {
                res.sendStatus(404)
            }
        })

    router.delete('/:id', async (req: RequestWithParams<{ id: string }>,
                                 res: Response) => {
        const deleteSuccessPromise: Promise<boolean> = articlesService.deleteArticle(+req.params.id)
        const deleteSuccess: true | false = await deleteSuccessPromise
        if (deleteSuccess) {
            res.sendStatus(204)
        } else {
            res.sendStatus(404)
        }
    })

    return router
}