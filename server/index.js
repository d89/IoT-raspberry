var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost/IoT', function(err, database) {
    if (err) throw err;

    console.log("DATABASE CONNECTED");

    var storage = require("./storage");
    storage.setDatabase(database);

    require("./data");
});
