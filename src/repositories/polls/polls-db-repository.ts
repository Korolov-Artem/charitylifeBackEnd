import { ObjectId } from "mongodb";
import { pollsCollection, PollType } from "../../db/db";
import { PollOption } from "../../db/db";

export const pollsRepository = {
  async getActivePoll(): Promise<PollType | null> {
    const poll = await pollsCollection.findOne({ isActive: true });
    return poll;
  },

  async incrementVote(
    pollId: string,
    optionId: string,
  ): Promise<PollType | null> {
    const result = await pollsCollection.findOneAndUpdate(
      // FIXED: Cast the ObjectId to 'any' to bypass the strict interface mismatch
      { _id: new ObjectId(pollId) as any, "options.id": optionId },
      { $inc: { "options.$.votes": 1 } },
      { returnDocument: "after" },
    );

    return result;
  },

  async createPoll(question: string, optionTexts: string[]): Promise<PollType> {
    // 1. Deactivate any currently active polls
    await pollsCollection.updateMany(
      { isActive: true },
      { $set: { isActive: false } },
    );

    // 2. Format the options into our database structure
    const options: PollOption[] = optionTexts.map((text, index) => ({
      id: `opt-${Date.now()}-${index}`, // Generate unique ID for each option
      text: text,
      votes: 0, // Start at 0 votes
    }));

    // 3. Create the new poll document (Removed strict :PollType so it doesn't complain about a missing _id)
    const newPoll = {
      question,
      options,
      isActive: true, // This is the new active poll
    };

    // 4. Save to MongoDB
    const result = await pollsCollection.insertOne(newPoll as PollType);

    // 5. Return the full object merged with the new MongoDB _id
    return { ...newPoll, _id: result.insertedId } as PollType;
  },
};
