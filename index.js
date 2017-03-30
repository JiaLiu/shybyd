const request = require('superagent');
const cheerio = require('cheerio');

request.get('http://202.96.245.182/xxcx/ddyd.jsp?lm=6').then(res => {
    const $ = cheerio.load(res.text);
    $('#main table:nth-of-type(2) tr').each((i, tr) => console.log(tr));
});