const Scraper = require("./scraper");

const { isNullOrUndefined } = require('util');

exports.checkPrices = (element) => {
    return new Promise((resolve, reject) => {
        var url = element._id;
        var minPrice = element.minPrice;
        var newPrice = Scraper.scrapePrice(url);
        newPrice.then((res) => {
            var p1 = parseInt(res.reply);
            if (!isNullOrUndefined(minPrice) && p1 >= minPrice) {
                console.log("No good news");
                resolve({
                    newPrice: false
                });
            } else {
                resolve({
                    newPrice: res.reply
                });
            }
        }).catch((err) => {
            reject({
                error: err
            })
        })
    });
}