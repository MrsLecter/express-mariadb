import { Router } from "express";
import { createScoreController } from "./controllers/scoreController";
import { getLeaderboardController } from "./controllers/leaderboardController";
import { getUserRankController } from "./controllers/userRankController";

const router = Router();

router.get("/leaderboard", getLeaderboardController);
router.get("/users/:id/rank", getUserRankController);
router.post("/scores", createScoreController);

export { router };
