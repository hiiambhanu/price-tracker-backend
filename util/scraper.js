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
                reply = $("#priceblock_ourprice").text();
                reply = reply.slice(1, reply.length).trim().replace(',', '');
                // console.log(reply);
                resolve({
                    reply: reply
                });
            })
            .catch((err) => reject({
                error: err
            }));
    });
}