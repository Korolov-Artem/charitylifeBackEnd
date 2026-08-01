import express, { Response } from "express";
import {
  RequestWithBody,
  RequestWithParams,
  RequestWithParamsAndBody,
  RequestWithQuery,
} from "../types";
import { ArticlesQueryModel } from "../models/articles/ArticlesQueryModel";
import { ArticleViewModel } from "../models/articles/ArticleViewModel";
import {
  ArticleURIParamsIdModel,
  RandomArtilceURIParamsModel,
} from "../models/articles/ArticleURIParamsIdModel";
import { ArticleCreateModel } from "../models/articles/ArticleCreateModel";
import { ArticleUpdateModel } from "../models/articles/ArticleUpdateModel";
import { body, matchedData, param } from "express-validator";
import { ArticleErrorsModel } from "../models/articles/ArticleErrorsModel";
import { inputValidationMiddleware } from "../middlewares/inputValidationMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { articlesService } from "../domain/articles-service";
import {
  articlesQueryRepository,
  PaginatedArticlesViewModel,
} from "../repositories/articles/articles-query-repository";
import { Sort } from "mongodb";

import { archiveExternalMedia } from "../managers/archiveMedia-manager";

const articlePostValidation = [
  body("title").trim().notEmpty().withMessage("Title cannot be empty").escape(),
  // Deliberately not escaped — this is Quill markup, and escaping it would
  // leave Cheerio nothing to parse in the archiver.
  body("content").trim().notEmpty().withMessage("Content cannot be empty"),
  body("theme").trim().notEmpty().withMessage("Theme cannot be empty").escape(),
  body("synopsis")
    .trim()
    .notEmpty()
    .withMessage("Synopsis cannot be empty")
    .escape(),
  body("image")
    .trim()
    .notEmpty()
    .withMessage("Image must be present")
    .isString(),
  body("imageCredits").optional().trim().isString(),
];

const titleValidation = body("title")
  .trim()
  .isLength({ min: 1, max: 300 })
  .withMessage(
    "Title length has to be no less than 1 symbol and no more than 300 symbols.",
  )
  .escape();

const articleUpdateValidation = [
  param("id")
    .notEmpty()
    .withMessage("id is required")
    .isInt()
    .withMessage("id should be a valid number"),
  body("title").optional().trim().isLength({ min: 1 }),
  body("theme").optional().trim().isLength({ min: 1 }),
  body("content").optional().trim().isLength({ min: 1 }),
];

export const getArticlesRoutes = () => {
  const router = express.Router();

  router.get(
    "/theme/:theme",
    async (req: any, res: Response<PaginatedArticlesViewModel>) => {
      const theme = req.params.theme;
      const page = req.query.page ? Number(req.query.page) : 1;

      const foundArticlesPromise: Promise<PaginatedArticlesViewModel> =
        articlesQueryRepository.findArticlesByTheme(theme, page);
      const foundArticles: PaginatedArticlesViewModel =
        await foundArticlesPromise;
      if (foundArticles) {
        res.status(200).json(foundArticles);
      }
    },
  );

  router.get(
    "/random",
    async (
      req: RequestWithParams<RandomArtilceURIParamsModel>,
      res: Response<ArticleViewModel[]>,
    ) => {
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const foundRandomArticlesPromise: Promise<ArticleViewModel[] | null> =
        articlesQueryRepository.getRandomArticles(limit);
      const foundRandomArticles = await foundRandomArticlesPromise;
      if (foundRandomArticles) {
        res.status(200).json(foundRandomArticles);
      } else {
        res.sendStatus(404);
      }
    },
  );

  router.get(
    "/",
    async (
      req: RequestWithQuery<ArticlesQueryModel>,
      res: Response<ArticleViewModel[]>,
    ) => {
      const sortByNewestDate = (): Sort => ({ dataPublished: -1 });

      const foundArticlesPromise: Promise<ArticleViewModel[]> =
        articlesQueryRepository.findArticles(
          req.query.title?.toString(),
          +req.query.pgNumber,
          +req.query.pgSize,
          sortByNewestDate(),
        );

      const foundArticles: ArticleViewModel[] = await foundArticlesPromise;
      res.status(200).json(foundArticles);
    },
  );

  router.get(
    "/:id",
    async (
      req: RequestWithParams<ArticleURIParamsIdModel>,
      res: Response<ArticleViewModel>,
    ) => {
      const foundArticlePromise: Promise<ArticleViewModel | null> =
        articlesQueryRepository.findArticleById(+req.params.id);
      const foundArticle: ArticleViewModel | null = await foundArticlePromise;
      if (foundArticle) {
        res.status(200).json(foundArticle);
      } else {
        res.sendStatus(404);
      }
    },
  );

  router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    articlePostValidation,
    titleValidation,
    inputValidationMiddleware,
    async (
      req: RequestWithBody<ArticleCreateModel>,
      res: Response<ArticleViewModel | null | ArticleErrorsModel>,
    ) => {
      const data = matchedData(req);

      // Archiving is best-effort; a failure here must not cost the author their draft.
      let processedContent = data.content;
      try {
        processedContent = await archiveExternalMedia(data.content);
      } catch (err) {
        console.error("Media archiving failed, saving original content", err);
      }

      const createdArticleId: number = await articlesService.createArticle(
        data.title,
        processedContent,
        data.theme,
        data.synopsis,
        data.image,
        data.imageCredits,
      );

      const createdArticle: ArticleViewModel | null =
        await articlesQueryRepository.findArticleById(createdArticleId);
      res.status(201).json(createdArticle);
    },
  );

  router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    articleUpdateValidation,
    titleValidation,
    inputValidationMiddleware,
    async (
      req: RequestWithParamsAndBody<{ id: string }, ArticleUpdateModel>,
      res: Response<ArticleViewModel | ArticleErrorsModel>,
    ) => {
      const data = matchedData(req);

      if (!data.title && !data.theme && !data.content) {
        res
          .status(400)
          .send({ errors: [{ msg: "At least one field must be provided" }] });
        return;
      }

      // Re-run the archiver: an edit can have pasted in fresh external media.
      let processedContent = data.content;
      if (processedContent) {
        try {
          processedContent = await archiveExternalMedia(processedContent);
        } catch (err) {
          console.error("Media archiving failed during update", err);
        }
      }

      const updatedData = {
        ...(data.title && { title: data.title }),
        ...(data.theme && { theme: data.theme }),
        ...(processedContent && { content: processedContent }),
      };

      const updatedArticleSuccess: boolean =
        await articlesService.updateArticle(+data.id, updatedData);

      if (updatedArticleSuccess) {
        const updatedArticle: ArticleViewModel | null =
          await articlesQueryRepository.findArticleById(+data.id);
        if (updatedArticle) {
          res.status(200).json(updatedArticle);
        } else {
          res.sendStatus(404);
        }
      } else {
        res.sendStatus(404);
      }
    },
  );

  router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req: RequestWithParams<{ id: string }>, res: Response) => {
      const deleteSuccessPromise: Promise<boolean> =
        articlesService.deleteArticle(+req.params.id);
      const deleteSuccess: true | false = await deleteSuccessPromise;
      if (deleteSuccess) {
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    },
  );

  return router;
};
