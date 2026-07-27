import express, { Request, Response } from "express";
import { pollsRepository } from "../repositories/polls/polls-db-repository";

export const getPollsRoutes = () => {
  const router = express.Router();

  router.get("/active", async (req: Request, res: Response) => {
    try {
      const activePoll = await pollsRepository.getActivePoll();

      if (activePoll) {
        res.status(200).json(activePoll);
      } else {
        res.status(404).json({ message: "No active poll found at this time." });
      }
    } catch (error) {
      console.error("Database error fetching poll:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/:id/vote", async (req: Request, res: Response) => {
    try {
      const pollId = req.params.id;
      const { optionId } = req.body;

      if (!optionId) {
        res.status(400).json({ message: "An optionId must be provided." });
        return;
      }

      const updatedPoll = await pollsRepository.incrementVote(pollId, optionId);

      if (updatedPoll) {
        res.status(200).json(updatedPoll);
      } else {
        res.status(404).json({ message: "Poll or Option not found." });
      }
    } catch (error) {
      console.error("Database error submitting vote:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/", async (req: Request, res: Response) => {
    try {
      const { question, options } = req.body;

      if (!question || !options || options.length < 2) {
        res
          .status(400)
          .json({ message: "A question and at least 2 options are required." });
        return;
      }

      const createdPoll = await pollsRepository.createPoll(question, options);
      res.status(201).json(createdPoll);
    } catch (error) {
      console.error("Database error creating poll:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};
