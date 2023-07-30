const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('./model/User.js')
require('./model/Course.js')
const router1 = require('./router/router.js');
const dotenv = require('dotenv');
const path = require('path')

dotenv.config()
 
const app = express();//to create an instance of the Express application object.
app.use(express.json())//`express.json()` is middleware provided by the Express framework for parsing incoming JSON data,  It is used to  automatically parse incoming JSON payloads and make the resulting data available in the `request.body` object.

app.use(express.urlencoded({ extended: true }));//middleware provided by the Express framework for parsing incoming HTTP requests with URL-encoded payloads. This middleware is used to automatically parse incoming URL-encoded payloads and make the resulting data available in the `request.body` object

const port = process.env.PORT || 8080; 
 
app.use(cors({ credentials: true }));
// app.use(cors({ origin: origin, credentials: true }));//provided by the `cors` package for enabling Cross-Origin Resource Sharing (CORS) in an Express app, CORS is a mechanism that allows a web page to make requests to a different domain 


mongoose.connect(`mongodb+srv://techfusio:${process.env.DB_PASSWORD}@cluster0.azdxdnh.mongodb.net/?retryWrites=true&w=majority`, { 
// mongoose.connect(`mongodb://localhost:27017`, {
    useNewUrlParser: true,//handle deprecation warnings from the MongoDB driver's default parser. It also provides better support for advanced connection string features like the `srv` protocol, which enables clients to discover MongoDB server instances via DNS records.
    useUnifiedTopology: true//new server discovery and monitoring engine .
}) 
    .then(() => {
        console.log("Successfully connect to MongoDB");
    })
    .catch(err => {
        console.error("Connection error", err.message);
    });


app.use('/', router1);

// Serving the frontent
app.use(express.static(path.join(__dirname, 'client', 'dist')))
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))

})

app.listen(port, () => {
    console.log(`Server is running on port - ${port}`);
}) 