const mongoose = require("mongoose");
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });

let db = mongoose.connection;

exports.db = db;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected to mongodb successfully");
});



const productSchema = new mongoose.Schema({
    _id: String,
    minPrice: Number,
    emails: [{ email: String, budget: Number, lastEmail: Date }],
    prices: [{ date: String, price: Number }],
});

exports.product = mongoose.model('product', productSchema);
