const express = require('express');
const assert = require('assert');
const bodyParser = require('body-parser');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

//Config
let app = express();
let server = require('http').createServer(app);
let port = 3000;
server.listen(process.env.PORT || port);
console.log('Server running on port ' + port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//Cached db
let cachedDatabase = [];

//Random integer
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

//index.html
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

//Serving questions and answers
app.get('/question', function(req, res){
    res.send(cachedDatabase[getRandomInt(cachedDatabase.length-1)]);
});

//Updating cached db
app.post('/update', function(req, res) {
    let file = JSON.parse(fs.readFileSync('./settings.json'));

    if(file.manualUpdates) {
        if(req.body.key === file.key) {
            update();
            res.send({message: "Db updated successfuly"});
        }
        else {
            res.send({message: "Incorrect key"});
        }
    }
    else {
        res.send({message: "No manual updates permitted, check settings.json"});
    }
});

//Fetching questions and answers from db
function fetchData(callback) {
let data = [];
let file = JSON.parse(fs.readFileSync('./settings.json'));

MongoClient
    .connect(file.uri, { useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
        
        assert.equal(null, err);
        const db = client.db(file.db);

        var dbCaching = () => {
            return new Promise((resolve, reject) => {

                db
                .collection(file.collection)
                .find({})
                .toArray(function(err, data) {
                    if(err) reject(err);
                    else resolve(data);
                });
            });
        }

        dbCaching().then(function(result) {
            client.close();
            data = result;
            callback(data); 
        });

    });

}

function update() {
    fetchData(function(result){
        cachedDatabase = result;
    });
}

update();