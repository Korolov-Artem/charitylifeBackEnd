import express, {Request, Response} from 'express';
import bodyParser from "body-parser";
import {RequestWithBody, RequestWithParams, RequestWithParamsAndBody, RequestWithQuery} from "./types";
import {ArticleCreateModel} from "./models/ArticleCreateModel";
import {ArticleUpdateModel} from "./models/ArticleUpdateModel";
import {ArticlesQueryModel} from "./models/ArticlesQueryModel";
import {ArticleViewModel} from "./models/ArticleViewModel";
import {ArticleURIParamsIdModel} from "./models/ArticleURIParamsIdModel";

export const app = express();
const port = process.env.PORT || 3000

const parserMiddleware = bodyParser.json();
app.use(parserMiddleware)

type ArticleType = {
    id: number,
    title: string,
    content: string,
    theme: string,
    dataPublished: string,
}

const db: { articles: ArticleType[] } = {
    articles: [
        {id: 1, title: 'New Health', content: '<h1>Hello World</h1>', theme: 'Medicine', dataPublished: '22.10.22'},
    ]
}

const ArticleGetViewModel = (dbArticle: ArticleType): ArticleViewModel => {
    return {
        id: dbArticle.id,
        title: dbArticle.title
    }
}

app.get('/articles', (req: RequestWithQuery<ArticlesQueryModel>,
                      res: Response<ArticleViewModel[]>) => {
    if (req.query.title) {
        let searchString = req.query.title.toString()
        res.send(db.articles.filter(a => a.title.toLowerCase().indexOf(searchString) > -1))
    }

    res.json(db.articles.map(ArticleGetViewModel))

    res.send(db.articles)

})

app.get('/articles/:id', (req: RequestWithParams<ArticleURIParamsIdModel>,
                          res: Response<ArticleViewModel>) => {
    let article = db.articles.find(
        a => a.id === +req.params.id)
    if (!article) {
        res.sendStatus(404)
    } else {
        res.json(ArticleGetViewModel(article))
    }
})

app.post('/articles', (req: RequestWithBody<ArticleCreateModel>, res: Response<ArticleViewModel>) => {
    if (!req.body.title) {
        res.sendStatus(400)
        return;
    }

    let newArticle: ArticleType = {
        id: +(new Date()), title: req.body.title,
        content: '', theme: '', dataPublished: ''
    }
    db.articles.push(newArticle)
    res.status(201).json(ArticleGetViewModel(newArticle))
})

app.put('/articles/:id', (req: RequestWithParamsAndBody<{ id: string }, ArticleUpdateModel>,
                          res: Response<ArticleViewModel>) => {
    let article = db.articles.find(a =>
        a.id === +req.params.id)
    if (article) {
        article.title = req.body.title
        res.status(200).send(article)
    } else {
        res.sendStatus(404)
    }
})

app.delete('/articles/:id', (req: RequestWithParams<{ id: string }>, res: Response) => {
    for (let i = 0; i < db.articles.length; i++) {
        if (db.articles[i].id === +req.params.id) {
            db.articles.splice(i, 1)
            res.sendStatus(204)
            return;
        }
    }
    res.sendStatus(404)
})

app.delete('/__test__/data', (req: Request, res: Response) => {
    db.articles = []
    res.sendStatus(204)
})

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    })
}
