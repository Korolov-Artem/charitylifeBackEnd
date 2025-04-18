import {app} from "./app";

const port = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    })
}
