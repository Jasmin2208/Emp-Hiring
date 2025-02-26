require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 8080;

global.DOMAIN = process.env.DOMAIN;
global.CLIENT_SIDE_URL = process.env.CLIENT_SIDE_URL;

const user = require('./routers/user');
const company = require('./routers/company');
const authentication = require('./routers/authentication');

const { errorMiddleware } = require("./middleware/error");

app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(express.json());

app.use("/user", user);
app.use("/company", company);
app.use("/authentication", authentication);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
