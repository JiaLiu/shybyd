const stringify = require('csv-stringify');
const fs = require("fs");
const { createPool } = require("mysql");

let pool;

function getPool() {
    if (!pool) {
        pool = createPool({
            host: 'localhost',
            user: 'root',
            password: 'Aa1119107',
            database: 'shybyd'
        });
    }
    return pool;
}

function storeData(data, tableName) {
    return new Promise((resolve, reject) => {
        stringify(data, { delimiter: '\t' }, (err, output) => {
            if (err) {
                reject(err);
            } else {
                const fileName = tableName + ".tsv";
                fs.writeFile(fileName, output, err => {
                    if (err) {
                        reject(err);
                    } else {
                        getPool().getConnection((err, connection) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                connection.query("LOAD DATA LOCAL INFILE '" + fileName + "' INTO TABLE " + tableName, (err) => {
                                    connection.release();
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve();
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    });
}


module.exports = {
    store: function (qxNames, stores) {
        return Promise.all([
            storeData(qxNames.map((qxName, i) => [i + 1, qxName]), "districts"),
            storeData(stores.map((result, i) => [i + 1, result.name, result.address, result.district + 1]), "stores")]);
    },
    end: function () {
        return new Promise((resolve, reject) => {
            if (pool) {
                pool.end((err) => {
                    if (err) {
                        throw err;
                    }

                    resolve();
                });
                pool = undefined;
            }
        })
    }
};