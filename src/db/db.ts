export type ArticleType = {
    id: number,
    title: string,
    content: string,
    theme: string,
    dataPublished: string,
}

export const db: { articles: ArticleType[] } = {
    articles: [
        {
            id: 1, title: 'New Health', content: '<h1>Hello World</h1>',
            theme: 'Medicine', dataPublished: '22.10.22'
        },
    ]
}

export type DBType = { articles: ArticleType[] }