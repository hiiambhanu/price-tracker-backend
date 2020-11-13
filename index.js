const port = process.env.PORT || 3000;
const expressUtil = require('./util/express');
const workerUtil = require("./util/worker");
const routes = require("./util/routes");

const app = expressUtil.app;

app.get('/', (req, res) => {
    res.sendFile('./static/index.html', { root: __dirname });
});

app.post('/chart', routes.chart);


app.post('/fetchPrice', routes.fetchPrice);

app.post('/currentPrice', routes.currentPrice)

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


const worker2 = workerUtil.worker2;


worker2();
setInterval(worker2, 1800000);


