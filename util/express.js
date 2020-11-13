const express = require('express')
const app = express()
const favicon = require('express-favicon');
var bodyParser = require('body-parser')
require('dotenv').config()
const cors = require("cors");
const path = require("path");
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(favicon(__dirname + '/static/favicon.png'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


exports.app = app;