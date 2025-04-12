import request from 'supertest'
import {app} from '../../src'
import {ArticleCreateModel} from "../../src/models/ArticleCreateModel";
import {ArticleUpdateModel} from "../../src/models/ArticleUpdateModel";

describe('/articles', () => {
    beforeAll(async () => {
        await request(app).delete('/__test__/data')
    })

    it('returns 200 and an empty array', async () => {
        await request(app)
            .get('/articles')
            .expect(200, [])
    })

    it('returns 404 when asking for a specific non-existent article', async () => {
        await request(app)
            .get('/articles/1')
            .expect(404)
    })

    it(`doesn't create an article with correct input data`, async () => {
        const data: ArticleCreateModel = {title: ''}

        await request(app)
            .post('/articles')
            .send(data)
            .expect(400)

        await request(app)
            .get('/articles')
            .expect(200, [])
    })

    let createdArticle: any = null

    it('creates an article with correct input data', async () => {
        const data: ArticleCreateModel = {title: 'new article'}

        const response = await request(app)
            .post('/articles')
            .send(data)
            .expect(201)

        createdArticle = response.body

        expect(createdArticle).toEqual({
            title: 'new article',
            id: expect.any(Number)
        })

        await request(app)
            .get('/articles/' + createdArticle.id)
            .expect(200, createdArticle)
    })

    it('updates an article with correct input data', async () => {
        const data: ArticleUpdateModel = {title: 'good new article'}

        await request(app)
            .put('/articles/' + createdArticle.id)
            .send(data)
            .expect(200)

        await request(app)
            .get('/articles/' + createdArticle.id)
            .expect(200, {
                ...createdArticle,
                title: 'good new article'
            })
    })

    it('deletes an article', async () => {
        await request(app)
            .delete('/articles/' + createdArticle.id)
            .expect(204)

        await request(app)
            .get('/articles/' + createdArticle.id)
            .expect(404)
    })
})