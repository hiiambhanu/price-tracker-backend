const Scraper = require("./scraper");
const mongo = require("./mongo");
const Gmailer = require("./gmailer");
const product = mongo.product;

exports.worker2 = async function () {
    var today = new Date().toLocaleDateString();
    
    var products = product.find({}, { _id: 1, minPrice: 1, prices: 1, emails: 1 });
    products.then((products) => {
        if (products.length == 0) return;

        products.forEach(async (p) => {

            var url = p._id;
            var priceToday = await Scraper.scrapePrice(url);
            priceToday = Number.parseInt(priceToday.reply);
            console.info("price", priceToday);

            if (p.prices == null) p.prices = [];
            var id = p.prices.findIndex((item, index) => {
                if (item.date == today) return true;
            });
            console.log("index", id);
            if (id == -1) {
                p.prices.push({ date: today, price: priceToday });
            }
            else {
                p.prices[id].price = Math.min(priceToday, p.prices[id].price);
            }

            p.emails.forEach((subscriber) => {
                if (subscriber.budget >= priceToday && (!subscriber.lastEmail || subscriber.lastEmail.toLocaleDateString() !== new Date().toLocaleDateString())) {
                    Gmailer.sendMessage(subscriber.email, { price: priceToday, url: url });
                    subscriber.lastEmail = new Date();
                }
            });

            p.save();
            
        })
    })
}