const charset = require('superagent-charset');
const request = charset(require('superagent'));
const cheerio = require('cheerio');
const some = require('lodash.some');
const strigify = require('csv-stringify');

function requestPage(method, configRequest) {
    let r = request(method || 'get', 'http://202.96.245.182/xxcx/ddyd.jsp').charset('gbk').retry(10);
    if (configRequest) {
        r = configRequest(r);
    }
    return r.then(res => cheerio.load(res.text));
}

const results = [];
const requestByQxcode = (qxcode, pageno) =>
    requestPage("post", request => request.type('form').send({
        pageno,
        qxcode
    })).then($ => {
        let count = 0;
        $('#main table:nth-of-type(2) tr').filter((i) => i % 2 === 1 && i > 1).each((i, tr) => {
            const children = $(tr).children();
            const object = {
                district: $(children[0]).text().trim(),
                name: $(children[1]).text().trim(),
                address: $(children[2]).text().trim(),
                comments: $(children[3]).text().trim()
            };
            if (!some(results, object)) {
                results.push(object);
                count++;
            }
        });
        console.log("The page %d adds %d items", pageno, count);
        return $;
    });

requestPage()
    .then($ => $('select[name="qxcode"] option[value]:not([value=""])').map((i, e) => $(e).attr("value")).get())
    .then(qxcodes => Promise.all(
        qxcodes.map(
            qxcode => requestByQxcode(qxcode, 1)
                .then($ => {
                    const children = $('.yypages').children();
                    const pageCount = +($(children[children.length - 2]).text());
                    console.log('Page count: %d', pageCount);
                    const promises = [];
                    for (let i = 2; i <= pageCount; i++) {
                        promises.push(requestByQxcode(qxcode, i));
                    }
                    return Promise.all(promises);
                })
        )
    ))
    .then(() => strigify(results, (err, output) => {
        console.log(output);
    }));