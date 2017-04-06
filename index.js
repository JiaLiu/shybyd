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
  return r.then(res => {
    return cheerio.load(res.text);
  });
}

requestPage().then($ => {
  return $('select[name="qxcode"] option[value]:not([value=""])').map(function() {
    return $(this).attr("value");
  }).get();
}).then(qxcodes => {
    
});

const results = [];
function loadPage(pageno, qxcode) {
  console.log("Request the page %d", pageNum);
  let first = !arguments.length;
  let r = request(first ? 'get' : 'post', 'http://202.96.245.182/xxcx/ddyd.jsp').charset('gbk').retry(10);
  if (!first) {
    r = r.type('form').send({
      pageno,
      qxcode
    });
  }
  r.then(res => {
    const $ = cheerio.load(res.text);
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
    console.log("The page %d adds %d items", pageNum, count);
    return $;
  });
}

request.get('http://202.96.245.182/xxcx/ddyd.jsp').retry(10).charset('gbk').then(res => {
  const $ = cheerio.load(res.text);
  $('select[name="qxcode"] option[value]:not([value=""])').map(function() {
    return $(this).attr("value");
  }).get();
});

// loadPage(1).then($ => {
//     const children = $('.yypages').children();
//     const pageCount = +($(children[children.length - 2]).text());
//     console.log('Page count: %d', pageCount);
//     return pageCount;
// }).then(pageCount => {
//     const promises = [];
//     for (let i = 2; i <= pageCount; i++) {
//         promises.push(loadPage(i));
//     }
//     return Promise.all(promises);
// }).then(() => strigify(results, (err, output) => {
//     console.log(output);
// }));