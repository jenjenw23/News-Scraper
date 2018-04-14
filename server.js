var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();



// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: true
}));

// parse application/json
app.use(bodyParser.json());
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));



// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/newsdbscraper");

// Routes
// landing page
app.get("/", function(req, res) {
	db.Article.find({}, null, {sort: {_id: -1}}, function(err, data) {
		if(data.length === 0) {
			res.render("starter", {message: "There's nothing scraped yet. Click the Scrape News Article link for new articles"});
		}
		else{
			res.render("index", {articles: data});
		}
	});
});

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.theatlantic.com/latest/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("li.article").each(function (i, element) {
      // Save an empty result object
      var result = {};

      var link = 'https://www.theatlantic.com' + $(element).find("a").attr("href");
      var title = $(element).find("h2.hed").text().trim();
      var summary = $(element).find("p.dek.has-dek").text().trim();
      result.link = link;
      result.title = title;
      result.summary = summary;

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({
      _id: req.params.id
    })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        note: dbNote._id
      }, {
        new: true
      });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


app.get("/saved", function(req, res) {
	db.Article.find({savedstatus: true}, null, {sort: {_id: -1}}, function(err, data) {
		if(data.length === 0) {
			res.render("starter", {message: "You have not saved any articles yet. Go back to home and click the Save Article button"});
		}
		else {
			res.render("saved", {articles: data});
		}
	});
});

app.post("/save/:id", function(req, res) {
	db.Article.findById(req.params.id, function(err, data) {
			db.Article.findByIdAndUpdate(req.params.id, {$set: {savedstatus: true}}, {new: true}, function(err, data) {
				res.redirect("/");
      });
	});
});


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});