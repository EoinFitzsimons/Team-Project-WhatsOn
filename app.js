// Description: This file is the main entry point for the application. It sets up the server and listens for incoming requests.
//importing the express library
import express from "express";
//importing the morgan library
import morgan from "morgan";
//importing the fetchData function from the fetchData.js file
import fetchData from "./Data Fetching/fetchData.js";
//importing the fs library
import fs from "fs";
//importing the path library
import bcrypt from "bcrypt";
//importing the body-parser library
import bodyParser from "body-parser";
//importing the path library
import path from "path";
//importing the url library
import { fileURLToPath } from "url";
//importing the crypto library
import crypto from "crypto";
//importing the fs library
const __filename = fileURLToPath(import.meta.url);
//importing the fs library
const __dirname = path.dirname(__filename);
import session from "express-session";
//creating a new express application
const app = express();
//setting the port to 3000
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


//this is used to create a session
const algorithm = "aes-256-ctr";
//this is used to create a session
const secretKey =
  "e497a267700bf5bba32f5984d6bc07e7077ac4c9e26efef61a115ee4084417fc"; // replace with your 64-character secret key

//this is used to create a session
function decrypt(encryptedApiKey, secretKey) {
  //this is used to buffer the key
  const key = Buffer.from(secretKey, "hex");
  //this is used to create a decipher
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.alloc(16));
  //this is used to decrypt the api key
  const decrypted = Buffer.concat([
    //this is used to update the api key
    decipher.update(Buffer.from(encryptedApiKey, "hex")),
    //this is used to finalize the api key
    decipher.final(),
  ]);
  //this is used to return the decrypted api key
  return decrypted.toString();
}
app.use(
  session({
    secret: "a",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set to true if your using https
  })
);
//this is used to create a session and decrypt the api key
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

//this is used to get users from the users.json file
app.get("/users", (req, res) => {
  // array to store the users
  let users = [];
  // Read users from the file
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

//this is used to get the followed groups from the followedGroups.json file
app.post("/users/register", async (req, res) => {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt();
    // body parser is used to parse the data from the front end
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    //this is used to log the salt and hashed password
    console.log(salt);
    console.log(hashedPassword);
    //this is used to create a new user
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
//this is used to get the followed groups from the followedGroups.json file
app.post("/users/login", async (req, res) => {
  console.log("Login route called. Request body:", req.body);

  let users;
  try {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "User Details", "users.json"),
      "utf8"
    );
    users = JSON.parse(fileContent);
    console.log("Users data read from file:", users);
  } catch (error) {
    console.error("Error reading users file:", error);
    res.status(500).send("Cannot find users file");
    return;
  }

  const user = users.find((user) => user.email === req.body.email);
  console.log("User found in file:", user);

  if (user == null) {
    return res.status(400).send("Cannot find user");
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      console.log("Password match. Setting session userEmail:", user.email);
      req.session.userEmail = user.email;
      console.log("Session after setting userEmail:", req.session);
      res.json({ success: true });
    } else {
      console.log("Password incorrect for user:", user.email);
      res.json({ success: false, message: "Password incorrect" });
    }
  } catch (error) {
    console.error("Error during password comparison:", error);
    res
      .status(500)
      .send({ success: false, message: "An error occurred during login" });
  }
});

app.get("/isLoggedIn", (req, res) => {
  console.log('Checking if user is logged in...');
  console.log(`req.session: ${JSON.stringify(req.session)}`);
  
  if (req.session && req.session.userEmail) {
    console.log(`User is logged in with email: ${req.session.userEmail}`);
    
    // Read users from the file
    fs.readFile(
      path.join(__dirname, "User Details", "users.json"),
      "utf8",
      (error, fileContent) => {
        if (error) {
          console.error('Error reading users file:', error);
          return res.status(500).send();
        }
        
        const users = JSON.parse(fileContent);
        // Filter users by the logged in email
        const accounts = users.filter(
          (user) => user.email === req.session.userEmail
        );
        
        console.log(`Found ${accounts.length} accounts for this user.`);
        return res.json({ isLoggedIn: true, accounts });
      }
    );
  } else {
    console.log('User is not logged in.');
    return res.json({ isLoggedIn: false });
  }
});


//this is used to get the followed group
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
//this is used to create a session
app.listen(port, () => {
  //this is used to listen for the port
  console.log("Running on port ", port);
});