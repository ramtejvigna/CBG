import express from "express"
import { PORT } from "./constants.js";

const app = express();

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
})