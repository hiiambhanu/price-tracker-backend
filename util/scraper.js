const cheerio = require("cheerio");
const axios = require("axios");

const isNullOrUndefined = (item) =>{
    return (item === null || item === undefined); 
}
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
                reply1 = parseInt(reply1);
                reply2 = parseInt(reply2);
                reply1 = Number.isNaN(reply1) ? Infinity : reply1;
                reply2 = Number.isNaN(reply2) ? Infinity : reply2;
                // console.log(reply1, reply2)
                var reply = Math.min(reply1, reply2);
                // console.log("here", reply);
                resolve({
                    reply: reply
                });
            })
            .catch((err) => reject({
                error: err
            }));
    });
}