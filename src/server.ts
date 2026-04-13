import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers";
import { router } from "./routes";
import { requestIdMiddleware } from "./utils/request";

const app = express();

app.use(requestIdMiddleware);
app.use(express.json());
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
