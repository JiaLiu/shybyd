const charset = require('superagent-charset');
const request = charset(require('superagent'));
const cheerio = require('cheerio');
const some = require('lodash.some');
const strigify = require('csv-stringify');
const os = require("os");
const fs = require("fs");

async function requestPage(method, configRequest) {
    let r = request(method || 'get', 'http://202.96.245.182/xxcx/ddyd.jsp').charset('gbk').retry(10);
    if (configRequest) {
        r = configRequest(r);
    }
    let res = await r;

    return await cheerio.load(res.text);
}

async function requestByQxcode(results, qxcode, qxName, district, pageno = 1) {    
    console.log('Query page %d for %s...', pageno, qxName);
    let $ = await requestPage("post", request => request.type('form').send({
        pageno,
        qxcode
    }));
    let count = 0;
    $('#main table:nth-of-type(2) tr').filter((i) => i % 2 === 1 && i > 1).each((i, tr) => {
        const children = $(tr).children();
        results.push({
            name: $(children[1]).text().trim(),
            address: $(children[2]).text().trim(),
            comments: $(children[3]).text().trim(),
            district
        });
        count++;
    });
    console.log('Add %d items from page %d for %s', count, pageno, qxName);
    return $;
}

(async () => {
    console.log('Start...');
    let $ = await requestPage();
    let qxCodes = [], qxNames = [];
    $('select[name="qxcode"] option[value]:not([value=""])').each(function () {
        let e = $(this);
        qxCodes.push(e.attr("value"));
        qxNames.push(e.text().trim());
    });
    console.log('Get qx codes as %s', qxCodes);
    console.log('Get qx names as %s', qxNames);
    qxCodes.slice(0, 2).forEach(async (qxCode, index) => {
        let qxName = qxNames[index];
        let results = [];
        let $ = await requestByQxcode(results, qxCode, qxName, index);
        const children = $('.yypages').children();
        const pageCount = +($(children[children.length - 2]).text());
        console.log('%s has %d pages', qxName, pageCount);
        let promises = [];
        for (let i = 2; i <= pageCount; i++) {
            promises.push(requestByQxcode(results, qxCode, qxName, index, i));
        }

        await Promise.all(promises);
    });

    fs.writeFile("districts.txt", qxNames.map((qxName, i) => i + "\t" + qxName).join(os.EOL), err => {
        console.log("success");
    });
})();
    // .then(qxcodes => Promise.all(
    //     qxcodes.map(
    //         qxcode => requestByQxcode(qxcode, 1)
    //             .then($ => {
    //                 const children = $('.yypages').children();
    //                 const pageCount = +($(children[children.length - 2]).text());
    //                 console.log('Page count: %d', pageCount);
    //                 const promises = [];
    //                 for (let i = 2; i <= pageCount; i++) {
    //                     promises.push(requestByQxcode(qxcode, i));
    //                 }
    //                 return Promise.all(promises);
    //             })
    //     )
    // ))
    // .then(() => strigify(results, (err, output) => {
    //     console.log(output);
    // }));