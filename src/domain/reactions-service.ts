import {reactionsRepository} from "../repositories/reactions/reactions-repository";
import {ReactionDBModel} from "../models/reactions/ReactionDBModel";

export const reactionsService = {
    async sendReaction(feedback: boolean, articleId: string, id: string) {
        const reaction: ReactionDBModel = {
            feedback, id, articleId
        }
        return await reactionsRepository.sendReaction(reaction)
    }
}
