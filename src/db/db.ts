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

/**
 * What the connection string looks like, without revealing it.
 *
 * "bad auth" says nothing about *why*, and the string usually arrives from a
 * hosting dashboard where a stray quote or an unsubstituted <placeholder> is
 * invisible. This prints enough to spot that and nothing worth redacting.
 */
const describeURI = (uri: string) => {
  // Computed first: a stray quote breaks the parse, and that is exactly the
  // case where naming the problem matters most.
  const notes: string[] = [];
  if (/[<>]/.test(uri)) notes.push("CONTAINS <placeholder> — not substituted");
  if (/["']/.test(uri)) notes.push("CONTAINS quotes — strip them");
  if (uri !== uri.trim()) notes.push("has leading/trailing whitespace");

  const parsed = /^(mongodb(?:\+srv)?:\/\/)(?:([^:@]*)(?::([^@]*))?@)?(.+)$/.exec(uri);
  if (!parsed) {
    return ["unparseable connection string", ...notes].join(" !! ");
  }

  const [, scheme, user, pass, host] = parsed;
  if (!pass) notes.push("no password present");

  return [
    `scheme=${scheme}`,
    `user=${user || "(none)"}`,
    `passwordLength=${pass ? pass.length : 0}`,
    `host=${host}`,
    notes.length ? `!! ${notes.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

export async function runDB() {
  try {
    await client.connect();
    await client.db("charitylife").command({ ping: 1 });
    console.log("Successfully connected to mongo server");
  } catch (error) {
    await client.close();
    // "bad auth" means the credentials were rejected; a timeout means the IP is
    // not on the Atlas access list. The description below covers the third case,
    // where the string itself never made it out of the dashboard intact.
    console.error("Error connecting to mongo server:", error);
    console.error("[db] MONGODB_URI:", describeURI(mongoURI));
    console.error(
      "[db] MONGODB_URI is set:",
      Boolean(process.env.MONGODB_URI),
    );
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
