const stringify = require('csv-stringify');
const fs = require("fs");

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

module.exports = {
    store: function (qxNames, stores) {
        return Promise.all([
            storeData(qxNames.map((qxName, i) => [i + 1, qxName]), "district"),
            storeData(stores.map((result, i) => [i + 1, result.name, result.address, result.comments, result.district + 1]), "stores")]);
    }
};