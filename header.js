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
    emails: [{ email: String, budget:  Number }],
    prices: [{ date: Date, price: Number }],
});

const product = mongoose.model('product', productSchema);
