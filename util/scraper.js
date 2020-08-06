const cheerio = require("cheerio");
const axios = require("axios");

const { isNullOrUndefined } = require('util');

exports.scrapePrice = (url) => {
    return new Promise((resolve, reject) => {
        if (isNullOrUndefined(url)) reject({
            error: "Invalid URL"
        });

        axios.get(url)
            .then((resp) => {
                const $ = cheerio.load(resp.data);
                reply1 = $("#priceblock_ourprice").text();
                reply2 = $("#priceblock_dealprice").text();
                reply1 = reply1.slice(1, reply1.length).trim().replace(',', '');
                reply2 = reply2.slice(1, reply2.length).trim().replace(',', '');
                var reply = Math.min(parseInt(reply1), parseInt(reply2));
                console.log(reply);
                resolve({
                    reply: reply
                });
            })
            .catch((err) => reject({
                error: err
            }));
    });
}