require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch(err => console.error(err));

//Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/resumes", require("./routes/resume.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/simulations", require("./routes/simulation.routes"));

//Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));