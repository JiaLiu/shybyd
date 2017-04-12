const charset = require('superagent-charset');
const request = charset(require('superagent'));
const cheerio = require('cheerio');
const stringify = require('csv-stringify');
const fs = require("fs");

async function requestPage(method, configRequest) {
    let r = request(method || 'get', 'http://202.96.245.182/xxcx/ddyd.jsp').charset('gbk').retry(10);
    if (configRequest) {
        r = configRequest(r);
    }
    let res = await r;

    return await cheerio.load(res.text);
}

async function requestByQxcode(results, qxcode, qxName, district, pageno) {
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

function storeData(data, tableName) {
    return new Promise((resolve, reject) => {
        stringify(data, { delimiter: '\t' }, (err, output) => {
            if (err) {
                reject(err);
            } else {
                fs.writeFile(tableName + ".tsv", output, err => err ? reject(err) : resolve());
            }
        });
    });
}

(async () => {
    console.time("all");
    let $ = await requestPage();
    let qxCodes = [],
        qxNames = [];
    $('select[name="qxcode"] option[value]:not([value=""])').each(function () {
        let e = $(this);
        qxCodes.push(e.attr("value"));
        qxNames.push(e.text().trim());
    });
    console.log('Get qx names as %s', qxNames);
    const results = [];
    await Promise.all(qxCodes.map(async (qxCode, index) => {
        const qxName = qxNames[index];
        const requestPageNo = (pageNo) => requestByQxcode(results, qxCode, qxName, index, pageNo);
        const $ = await requestPageNo(1);
        const children = $('.yypages').children();
        const len = children.length;
        const pageCount = len > 2 ? +($(children[children.length - 2]).text()) : 1;
        console.log('%s has %d pages', qxName, pageCount);
        if (pageCount > 1) {
            const promises = [];
            for (let i = 2; i <= pageCount; i++) {
                promises.push(requestPageNo(i));
            }
            await Promise.all(promises);
        }
    }));

    await Promise.all([storeData(qxNames.map((qxName, i) => [i + 1, qxName]), "district"), storeData(results.map((result, i) => [i + 1, result.name, result.address, result.comments, result.district]), "stores")]);
    console.timeEnd("all");
})();