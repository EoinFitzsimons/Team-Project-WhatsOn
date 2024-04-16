import express from "express";
import morgan from "morgan";
import fetchData from "./Data Fetching/fetchData.js";
import fs from "fs";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs"); // this calls for the ejs libary
app.use(express.static("css")); //loads all of the static files from the css folder
app.use("/images", express.static(path.join(__dirname, "Images"))); //shoukl be able to load images from the images folder
app.use(express.static("Images")); //loads all of the static files from the css folder
app.use(express.urlencoded({ extended: true })); //takes values from the front end and brings the
app.use(morgan("dev")); //enables logging information regarding the server
app.use(express.static("Data Fetching")); //CJ- loads all of the static files from the Data Fetching folder
app.use(bodyParser.json());
app.use(express.json()); //this is used to parse the json data

app.listen(port, () => {
  console.log("Running on port ", port);
});

const algorithm = "aes-256-ctr";
const secretKey =
  "e497a267700bf5bba32f5984d6bc07e7077ac4c9e26efef61a115ee4084417fc"; // replace with your 64-character secret key

function decrypt(encryptedApiKey, secretKey) {
  const key = Buffer.from(secretKey, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.alloc(16));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedApiKey, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
}

app.post("/decrypt", (req, res) => {
  const encryptedApiKey = req.body.encryptedApiKey;
  const decryptedApiKey = decrypt(encryptedApiKey, secretKey);
  res.json({ decryptedApiKey });
});

app.get("/", async (req, res) => {
  try {
    // Call fetchData() and wait for it to finish
    await fetchData();
    console.log("Data fetched successfully");
    // Rendering the 'index' template
    res.render("index", { title: "Home" });
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
    res.status(500).send("Error fetching data");
  }
});

app.get("/users", (req, res) => {
  let users = [];
  try {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "User Details", "users.json"),
      "utf8"
    );
    users = JSON.parse(fileContent);
  } catch (error) {
    console.error(error);
    res.status(500).send();
    return;
  }

  res.json(users);
});

app.post("/users/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log(salt);
    console.log(hashedPassword);
    const newUser = { email: req.body.email, password: hashedPassword };

    let users = [];

    // Read users from the file
    try {
      const fileContent = fs.readFileSync(
        path.join(__dirname, "User Details", "users.json"),
        "utf8"
      );
      users = JSON.parse(fileContent);
      if (!Array.isArray(users)) {
        users = [];
      }
    } catch (error) {
      // If file does not exist, ignore the error
      if (error.code !== "ENOENT") {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "An error occurred while reading the users file.",
        });
        return;
      }
    }
    // Check if the email is already in use
    const existingUser = users.find((user) => user.email === newUser.email);
    if (existingUser) {
      res
        .status(400)
        .json({ success: false, message: "Email already in use." });
      return;
    }
    // Add the new user
    users.push(newUser);

    // Write the updated users back to the file
    try {
      fs.writeFileSync(
        "./User Details/users.json",
        JSON.stringify(users),
        "utf8"
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred while writing to the users file.",
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred during registration.",
    });
    console.log(error);
    return;
  }
  res.json({ success: true, message: "Account created successfully." });
});

app.post("/users/login", async (req, res) => {
  let users;
  try {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "User Details", "users.json"),
      "utf8"
    );
    users = JSON.parse(fileContent);
  } catch (error) {
    console.error(error);
    res.status(500).send("Cannot find users file");
    return;
  }
  const user = users.find((user) => user.email === req.body.email);

  if (user == null) {
    return res.status(400).send("Cannot find user");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Password incorrect" });
    }
  } catch {
    res
      .status(500)
      .send({ success: false, message: "An error occured during login" });
  }
});

app.get("/isLoggedIn", (req, res) => {
  if (req.session && req.session.userEmail) {
    // Read users from the file
    let users = [];
    try {
      const fileContent = fs.readFileSync(
        path.join(__dirname, "User Details", "users.json"),
        "utf8"
      );
      users = JSON.parse(fileContent);
    } catch (error) {
      console.error(error);
      res.status(500).send();
      return;
    }

    // Filter users by the logged in email
    const accounts = users.filter(
      (user) => user.email === req.session.userEmail
    );
    res.json({ isLoggedIn: true, accounts });
  } else {
    res.json({ isLoggedIn: false });
  }
});

app.post("/followGroup", (req, res) => {
  const { userEmail, groupName, groupLink } = req.body;
  console.log(
    `userEmail: ${userEmail}, groupName: ${groupName}, groupLink: ${groupLink}`
  );
  fs.readFile("followedGroups.json", "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        const followedGroups = [{ userEmail, groupName, groupLink }];
        fs.writeFileSync(
          "followedGroups.json",
          JSON.stringify(followedGroups, null, 2)
        );
        res.json({ success: true, message: "The group has been followed!" });
      } else {
        res
          .status(500)
          .json({ success: false, message: `Error reading file: ${err}` });
      }
      return;
    }

    const followedGroups = data ? JSON.parse(data) : [];
    const isFollowing = followedGroups.some(
      (group) => group.userEmail === userEmail && group.groupName === groupName
    );

    if (isFollowing) {
      res.json({
        success: false,
        message: "The user is already following this group.",
      });
      return;
    }

    followedGroups.push({ userEmail, groupName, groupLink });
    fs.writeFileSync(
      "followedGroups.json",
      JSON.stringify(followedGroups, null, 2)
    );
    res.json({ success: true, message: "The group has been followed!" });
  });
});

app.use((req, res) => {
  //this is used to direct the user to the 404 page if the page they are looking for does not exist
  res.status(404).render("404", { title: "404 Page" });
});
