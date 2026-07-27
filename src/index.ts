// Must precede every other import: db.ts and settings.ts read process.env at
// module load, which happens as soon as they are pulled in below.
import "dotenv/config";

import {app} from "./app";
import {runDB} from "./db/db";

const port = process.env.PORT || 3000

export const startApp = async () => {
    await runDB()
    if (process.env.NODE_ENV !== 'test') {
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        })
    }
}

startApp()