import { MongoClient } from "mongodb";
import { UserDBModel } from "../models/users/UserDBModel";
import { ReactionDBModel } from "../models/reactions/ReactionDBModel";
import { ObjectId } from "mongodb";

export interface MediaAsset {
  _id?: ObjectId;
  filename: string;
  url: string;
  uploadedAt: Date;
  /** Cloudinary handle, needed to delete or transform the asset later. */
  publicId?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollType {
  _id?: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
}

export type ArticleType = {
  id: number;
  title: string;
  content: string;
  theme: string;
  synopsis: string;
  dataPublished: Date;
  author: string;
  image: string;
  imageCredits: string;
};

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017";

const client = new MongoClient(mongoURI);
const db = client.db("charitylife");

export const articlesCollection = db.collection<ArticleType>("articles");
export const usersCollection = db.collection<UserDBModel>("users");
export const reactionsCollection = db.collection<ReactionDBModel>("reactions");
export const pollsCollection = db.collection<PollType>("polls");

export async function runDB() {
  try {
    await client.connect();
    await client.db("charitylife").command({ ping: 1 });
    console.log("Successfully connected to mongo server");
  } catch (error) {
    await client.close();
    // The message distinguishes bad credentials from an IP that isn't on the
    // Atlas access list, which are otherwise indistinguishable from here.
    console.error("Error connecting to mongo server:", error);
  }
}

export const memoryDB: { articles: ArticleType[]; polls: PollType[] } = {
  articles: [
    {
      id: 1,
      title: "New Health",
      content: "<h1>Hello World</h1>",
      theme: "Medicine",
      dataPublished: new Date(),
      author: "Gene Korolov",
      synopsis: "",
      image: "",
      imageCredits: "",
    },
  ],
  polls: [
    {
      _id: "poll-123",
      question: "Which digital format will define the next era of publishing?",
      options: [
        { id: "opt-1", text: "Immersive AR/VR", votes: 142 },
        { id: "opt-2", text: "Long-form Text & Audio", votes: 890 },
        { id: "opt-3", text: "Short-form Video", votes: 45 },
        { id: "opt-4", text: "Interactive Data Journals", votes: 312 },
      ],
      isActive: true,
    },
  ] as PollType[],
};

export const mediaCollection = db.collection<MediaAsset>("media");

export type DBType = { articles: ArticleType[] };
