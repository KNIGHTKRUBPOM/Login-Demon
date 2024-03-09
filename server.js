const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

const uri = process.env.MONGO_URI;
const saltRounds = process.env.SALT_ROUNDS;

const app = express();

app.use(bodyParser.json());

//Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const database = client.db("users");
    const collection = database.collection("users");

    const hashedPassword = await bcrypt.hash(password, parseInt(saltRounds));

    const user = await collection.insertOne({
      username: username,
      password: hashedPassword,
    });
    res.json({
      success: true,
      message: "Register successful",
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Register Failed",
    });
  } finally {
    await client.close;
  }
});

//Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const database = client.db("users");
    const collection = database.collection("users");

    const user = await collection.findOne({ username: username });

    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const token = jwt.sign({ username: username }, process.env.SECRET, {
          expiresIn: "1h",
        });
        res.json({
          success: true,
          message: "Login Successful",
          token: token,
        });
      } else {
        res.jsos({
          success: false,
          message: "Login failed",
        });
      }
    } else {
      res.json({
        success: false,
        message: "Login failed",
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: "Login failed",
    });
  } finally {
    await client.close();
  }
});

//Verify Token
function verityToken(req, res, next) {
  const token = req.header["authorization"];
  if (typeof token !== "underfined") {
    jwt.verify(token, process.env.SECRET, (err, authData) => {
      if (err) {
        res.sendStatus(403);
      } else {
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
}

//GET ALL USERS
app.get("/users", verityToken, async (req, res) => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    const database = client.db("users");
    const collection = database.collection("users");

    const users = await collection.find({}).toArray();
    res.json({
      success: true,
      message: "Get user successful",
      data: users,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Get users failed",
    });
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});
