import express from 'express';
import morgan from 'morgan';
import fetchData from './Data Fetching/fetchData.js';
import fs from 'fs';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import env from 'dotenv';

env.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const con = process.env.mapApiKey;
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs'); // this calls for the ejs libary
app.use(express.static('css')); //loads all of the static files from the css folder
app.use('/images', express.static(path.join(__dirname, 'Images'))); // loads all of the static files from the images folder, sets the path at project level.
app.use(express.urlencoded({ extended: true })); //takes values from the front end and brings the
app.use(morgan('dev')); //enables logging information regarding the server
app.use(bodyParser.json());
app.use(express.json()); //this is used to parse the json data

app.listen(port, () => {
  console.log('Running on port ', port);
});

app.get('/', async (req, res) => {
  try {
    // Call fetchData() and wait for it to finish
    await fetchData();
    console.log('Data fetched successfully');
    // Rendering the 'index' template
    res.render('index', { title: 'Home' }); 
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
    res.status(500).send('Error fetching data');
  }
});

app.get('/api-key', (req, res) => {
  res.json({ apiKey: con });
});

app.get('/users', (req, res) => {
  let users = []
  try {
      const fileContent = fs.readFileSync(path.join(__dirname, 'User Details', 'users.json'), 'utf8');
      users = JSON.parse(fileContent);
  } catch (error) {
      console.error(error);
      res.status(500).send();
      return;
  }

  res.json(users);
});

app.post('/users/register', async (req, res) => {
  try{
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      console.log(salt);
      console.log(hashedPassword);
      const user = {email:  req.body.email, password: hashedPassword};

      let users = [];

      // Read users from the file
      try {
        const fileContent = fs.readFileSync(path.join(__dirname, 'User Details', 'users.json'), 'utf8');
          users = JSON.parse(fileContent);
          if (!Array.isArray(users)) {
              users = [];
          }
      } catch (error) {
          // If file does not exist, ignore the error
          if (error.code !== 'ENOENT') {
              console.error(error);
              res.status(500).json({ success: false, message: 'An error occurred while reading the users file.' });
              return;
          }
      }

      // Add the new user
      users.push(user);

      // Write the updated users back to the file
      try {
          fs.writeFileSync('./User Details/users.json', JSON.stringify(users), 'utf8');
      } catch (error) {
          console.error(error);
          res.status(500).json({ success: false, message: 'An error occurred while writing to the users file.' });
          return;
      }
  } catch(error){
      res.status(500).json({ success: false, message: 'An error occurred during registration.' });
      console.log(error);
      return;
  }
  res.json({ success: true, message: 'Account created successfully.' });
});

app.post('/users/login', async (req, res) => {
 let users;
  try {
    const fileContent = fs.readFileSync(path.join(__dirname, 'User Details', 'users.json'), 'utf8');
    users = JSON.parse(fileContent);
  } catch (error) {
      console.error(error);
      res.status(500).send('Cannot find users file');
      return;
  }
  const user = users.find(user => user.email = req.body.email);

  if(user ==null){
      return res.status(400).send('Cannot find user');
  }
  try{
    if( await bcrypt.compare(req.body.password, user.password)){
      res.json({success: true});
      
    } else {
      res.json({success: false, message: 'Password incorrect'});
    }
  } catch{
      res.status(500).send({success: false, message: 'An error occured during login'});
  }
  
});


app.use((req, res) => { //this is used to direct the user to the 404 page if the page they are looking for does not exist 
  res.status(404).render('404', { title: '404 Page' });
});
