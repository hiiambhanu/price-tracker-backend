const mongo = require("./mongo");
const Scraper = require("./scraper");
const product = mongo.product;


exports.chart = async (req, res) => {
    var url = req.body.url;
    if (url === null || url === undefined) res.sendStatus(400);
    var p = await product.findOne({ _id: url }, { prices: 1 });
    console.log(p);
    if (p == null) return res.json("");
    res.json({ prices: p.prices, currentPrice: 0 });
};

exports.currentPrice = async (req, res) => {
    var url = req.body.url;
    if (url === null || url === undefined) res.sendStatus(400);
    let currentPrice = await Scraper.scrapePrice(url);

    console.log(currentPrice.reply);

    res.json({ currentPrice: currentPrice.reply });

    let today = new Date().toLocaleDateString();

    var p = await product.findOne({ _id: url }, { prices: 1 });
    if(!p) return;
    if (p.prices == null) p.prices = [];
    var id = p.prices.findIndex((item, index) => {
        if (item.date == today) return true;
    });
    
    if (id == -1) {
        p.prices.push({ date: today, price: currentPrice.reply });
    }
    else {
        p.prices[id].price = Math.min(currentPrice.reply, p.prices[id].price);
    }
    p.save();
}


exports.fetchPrice = (req, res) => {
    var url = req.body.url;
    var email = req.body.email;
    var budget = req.body.budget;
    
    if (url === null || url === undefined) {
        console.log("Empty URL");
        res.sendStatus(400);
    }

    product.findById(url, (err, item) => {
        if (err) {
            console.log(error);
            res.sendStatus(500);
        }
        else if (!(item === null || item === undefined)) {
            console.log("email was in the db, updating the budget.");
            var id = item.emails.findIndex((e, id) => {
                if (e.email == email) return true;
            });
            if (id != -1){ 
                res.sendStatus(200);
                item.emails[id].budget = budget;
                item.save();
            }
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
}