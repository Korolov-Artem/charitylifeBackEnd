export type ArticleType = {
    id: number,
    title: string,
    content: string,
    theme: string,
    dataPublished: string,
    author: string,
}

export const db: { articles: ArticleType[] } = {
    articles: [
        {
            id: 1, title: 'New Health', content: '<h1>Hello World</h1>',
            theme: 'Medicine', dataPublished: '22.10.22', author: 'Gene Korolov',
        },
    ]
}

export type DBType = { articles: ArticleType[] }