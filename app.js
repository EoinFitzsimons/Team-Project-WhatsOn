const express = require('express'); //calls the express libary
const morgan = require('morgan');
const app = express(); // changes the name of the express call to app, saves time on typing

app.set('view engine', 'ejs'); // this calls for the ejs libary

app.listen(3000); //sets the port number to 3000


//middle ware to access static files
app.use(express.static('css'));
app.use(express.static('images'));

app.use(morgan('dev'));


app.get('/', (req, res) => { //this gets the request from the navigation from the webpage and loads that page
    res.render('index', { title: 'Home' }); // tells the code to render the index file
});

app.get('/follow', (req, res) => { //this gets the request from the navigation from the webpage and loads that page
    res.render('follow', { title: 'Follow Page' }); // tells the code to render the index file
});

app.get('/signup', (req, res) => { //this gets the request from the navigation from the webpage and loads that page
    res.render('signup', { title: 'Sign Up' }); // tells the code to render the index file
});

app.get('/login', (req, res) => { //this gets the request from the navigation from the webpage and loads that page
    res.render('login', { title: 'Login' }); // tells the code to render the index file
});

app.get('/contact-us', (req, res) => { //this gets the request from the navigation from the webpage and loads that page
    res.render('contact-us', { title: 'Conact Us' }); // tells the code to render the index file
});


app.use((req, res) => { //this is used to direct the user to the 404 page if the page they are looking for does not exist 
    res.status(404).render('404', { title: '404 Page' });
});
