'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

//random words
var randomWords = require('random-words');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

var db = mongoose.connection;

// test mongoose connection:

// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log("we're connected!");
// });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json())

//serve public folder
app.use('/public', express.static(process.cwd() + '/public'));

//creating schema and model
var siteSchema = new mongoose.Schema({
  long: String,
  short: String
});  
//model
var Site = mongoose.model("Site", siteSchema);

//model test
// var nhl = new Site({long:"nhl.com", short:randomWords({exactly: 1, maxLength: 6})});
// console.log(nhl.long + " " + nhl.short);


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// post route for forms
app.post('/api/shorturl/new', function(req, res){
        //If I pass an invalid URL that doesn't follow the http(s)://www.example.com(/more/routes) format, the JSON response will contain an error like {"error":"invalid URL"}
        // HINT: to be sure that the submitted url points to a valid site you can use the function dns.lookup(host, cb) from the dns core module.
  
      var capturedUrl = req.body.url
      console.log(capturedUrl)

      //remove https/http? https://www.npmjs.com/package/parse-domain ???

      //Extract hostname name from string:
      function extractHostname(url) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("//") > -1) {
            hostname = url.split('/')[2];
        }
        else {
            hostname = url.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    }
      //test
      // console.log(extractHostname(capturedUrl));

      //dns lookup to validate url (dont use https, lookup does not work with it??)
      dns.lookup(extractHostname(capturedUrl), function(err, address){
        if(err){
           console.log(err)
           res.json({"error":"invalid URL"});
          }else {
            console.log(address);
            // valid url, save to database with short url
                                                              //make unique random name with randomWords library
              var someVarName = new Site({long: capturedUrl, short:randomWords({exactly: 1, maxLength: 6})}); 
              //save
              someVarName.save(function (err, data) {
                if (err) return console.error(err);
                console.log("saved:" + data);
                res.json({"original_url": someVarName.long , "short_url": someVarName.short});
              });
          }
  });

  //take form data and save to db as new Site 
  console.log(req.body.url);  
// res.json({"original_url":foundSite.long,"short_url":foundSite.short});
  // res.sendFile(process.cwd() + '/views/index.html');
});

//show route
//When I visit the shortened URL, it will redirect me to my original link.
app.get('/api/shorturl/:shorturl', function(req, res){
  var shortUrl = req.params.shorturl
  console.log(shortUrl)
  //find shorturl from db
  Site.findOne({short: shortUrl}).exec(function(err, foundSite){
     if(err) {
       console.log(err);
       }else{
    console.log(foundSite.long);
      res.redirect(foundSite.long);
       }
    })
             
  });


app.listen(port, function () {
  console.log('Node.js listening ...');
});