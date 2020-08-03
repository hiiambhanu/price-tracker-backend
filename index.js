const express = require('express')
const app = express()
var bodyParser = require('body-parser')
const port = process.env.PORT || 3000
require('dotenv').config()
const cors = require("cors");
const { isNullOrUndefined } = require('util');
const path = require("path");
const mongoose = require("mongoose");
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const Scraper = require("./util/scraper");
const Gmailer = require("./util/gmailer");
const Worker = require("./util/worker");
const { BADQUERY } = require('dns');


mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected to mongodb successfully");
});

const productSchema = new mongoose.Schema({
    _id: String,
    minPrice: Number,
    emails: [],
    prices: [{ date: Date, price: Number }],
});

const product = mongoose.model('product', productSchema);

app.get('/checkmailer', (req, res) => {
    var email = "bhanupratapsinghdbs@gmail.com";
    Gmailer.sendMessage(email, { price: 69, url: "www.example.com" });
    res.sendStatus(200);
})

app.get('/', (req, res) => {
    res.sendFile('./static/index.html', { root: __dirname });
});

app.get('/fetchPrice', async (req, res) => {
    var url = req.query.url;
    if (isNullOrUndefined(url)) res.sendStatus(404);
    var scraped = Scraper.scrapePrice(url);
    scraped.then((resp) => {
        console.log("scraped " + resp);
        res.send(resp);
    })
        .catch((err) => {
            return console.log(err);
        });
});

app.post('/fetchPrice', (req, res) => {
    var url = req.body.url;
    var email = req.body.email;
    if (isNullOrUndefined(url)) {
        console.log("Empty URL");
        res.sendStatus(BADQUERY);
    }

    product.findById(url, (err, item) => {
        if (err) {
            console.log(error);
            res.sendStatus(500);
        }
        else if (!isNullOrUndefined(item)) {
            console.log("item was in the db");
            if (item.emails.includes(email)) res.sendStatus(200);
            else {
                item.emails.push(email);
                product.updateOne({ _id: url }, { emails: res.emails }, (err, succ) => {
                    if (err) res.sendStatus(500);
                    res.sendStatus(302);
                });
            }
        }
        else {
            var price = Scraper.scrapePrice(url);
            price.then((ress) => {
                const newProduct = new product({
                    "_id": url,
                    "minPrice": ress.reply,
                    "emails": [email],
                    "prices": [],
                });
                newProduct.save((err, newprod) => {
                    if (err) { res.sendStatus(500); }
                    if (newprod) {
                        console.log("saved");
                        res.sendStatus(302);
                    }
                })
            }).catch((err) => {
                console.log(err);
                res.sendStatus(500);
            })
        }
    });
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

var workerFunction = async function () {
    var arr = product.find({}, { _id: 1, minPrice: 1 });
    arr.then((res) => {
        res.map(async (elem) => {
            var newPrice = Worker.checkPrices(elem);

            newPrice.then((res) => {
                if (res.newPrice == false) return;
                else {
                    console.log(elem);
                    var query = { "_id": elem._id };
                    product.findById(elem.id, (err, succ) => {
                        if (err) return console.log(err);
                        else {
                            succ.emails.map((email) => {
                                Gmailer.sendMessage(email, { price: res.newPrice, url: elem._id });
                            })
                            console.log(succ);
                        }
                    });
                    product.updateOne(query, { minPrice: res.newPrice }, (err, succ) => {
                        if (err) return console.log("err");
                        return console.log("succ");
                    });
                    return console.log(res);
                }
            })
                .catch((err) => console.log(err));
        }
        )
    });
}

workerFunction();
setInterval(workerFunction, 7200000);