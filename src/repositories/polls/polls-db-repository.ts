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
      // PollType declares _id loosely, so the driver's filter type rejects a real ObjectId.
      { _id: new ObjectId(pollId) as any, "options.id": optionId },
      { $inc: { "options.$.votes": 1 } },
      { returnDocument: "after" },
    );

    return result;
  },

  async createPoll(question: string, optionTexts: string[]): Promise<PollType> {
    // Only one poll runs at a time; publishing a new one retires the old.
    await pollsCollection.updateMany(
      { isActive: true },
      { $set: { isActive: false } },
    );

    const options: PollOption[] = optionTexts.map((text, index) => ({
      id: `opt-${Date.now()}-${index}`,
      text: text,
      votes: 0,
    }));

    // Untyped until insert, since _id doesn't exist yet.
    const newPoll = {
      question,
      options,
      isActive: true,
    };

    const result = await pollsCollection.insertOne(newPoll as PollType);

    return { ...newPoll, _id: result.insertedId } as PollType;
  },
};
