import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoute from "./routes/authRoute.js";
import sessionRoute from "./routes/sessionRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://live-class-project-1.onrender.com",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOption = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Live class server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoute);
app.use("/api/session", sessionRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});