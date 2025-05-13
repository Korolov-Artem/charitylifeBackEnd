import {reactionsCollection} from "../../db/db";
import {ReactionDBModel} from "../../models/reactions/ReactionDBModel";

export const reactionsRepository = {
    async sendReaction(reaction: ReactionDBModel) {
        await reactionsCollection.insertOne(reaction)
        return {
            feedback: reaction.feedback,
            articleId: reaction.articleId
        }
    }
}