const express = require('express')
const app = express()
const favicon = require('express-favicon');
var bodyParser = require('body-parser')
const port = process.env.PORT || 3000
require('dotenv').config()
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(favicon(__dirname + '/static/favicon.png'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const Scraper = require("./util/scraper");
const Gmailer = require("./util/gmailer");
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
    emails: [{ email: String, budget:  Number }],
    prices: [{ date: String, price: Number }],
});

const product = mongoose.model('product', productSchema);

app.get('/', (req, res) => {
    res.sendFile('./static/index.html', { root: __dirname });
});

app.post('/chart', async(req, res)=>{
    var url = req.body.url;
    if(url === null || url === undefined) res.sendStatus(400);
    var p = await product.findOne({_id: url}, {prices: 1});
    console.log(p);
    if(p==null) return res.json("");
    res.json(p.prices);
});


app.get('/fetchPrice', async (req, res) => {
    var url = req.query.url;
    if (url === null || url === undefined) res.sendStatus(404);
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
    var budget = req.body.budget;
    budget = 0;                     // TO REMOVE
    if (url === null || url === undefined) {
        console.log("Empty URL");
        res.sendStatus(BADQUERY);
    }

    product.findById(url, (err, item) => {
        if (err) {
            console.log(error);
            res.sendStatus(500);
        }
        else if (!(item === null || item === undefined)) {
            console.log("item was in the db");
            var id = item.emails.findIndex((e, id)=>{
                if(e.email == email) return true;
            });
            if (id != -1) res.sendStatus(200);
            else {
                item.emails.push({ "email": email, "budget": budget });
                product.updateOne({ _id: url }, { emails: item.emails }, (err, succ) => {
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
                    "emails": [{ "email": email, "budget": budget }],
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


var worker2 = async function(){
    var today = new Date().toLocaleDateString();

    var products = product.find({}, {_id: 1, minPrice : 1, prices: 1, emails: 1});
    products.then((products)=>{
        if(products.length == 0 ) return;

        products.map(async (p)=>{

            var url = p._id;
            var priceToday = await Scraper.scrapePrice(url);
            priceToday = Number.parseInt(priceToday.reply);

            if(p.prices == null) p.prices = [];
            var id = p.prices.findIndex((item, index)=>{
                if(item.date == today) return true;
            });
            console.log(id);
            if(id == -1){
                p.prices.push({date: today, price: priceToday});    
            }
            else{
                p.prices[id].price = Math.min(priceToday, p.prices[id].price);
            }
            p.save();

            p.emails.map((subscriber)=>{
                if(subscriber.budget >= priceToday){
                    Gmailer.sendMessage(subscriber.email, { price: priceToday, url: url });
                }
            });

            console.log("exiting");

        })
    })
}

worker2();
// setInterval(worker2, 7200000);