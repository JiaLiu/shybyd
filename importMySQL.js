const stringify = require("csv-stringify");
const fs = require("fs");
const { exec } = require("child_process");
const { join } = require("path");

module.exports = async function(qxNames, stores, binPath, user, password) {
  const fileNames = await Promise.all(
    [
      [qxNames.map((qxName, i) => [i + 1, qxName]), "districts"],
      [
        stores.map((result, i) => [
          i + 1,
          result.name,
          result.address,
          result.district + 1
        ]),
        "stores"
      ]
    ].map(
      ([data, tableName]) =>
        new Promise((resolve, reject) => {
          stringify(data, { delimiter: "\t" }, (err, output) => {
            if (err) {
              throw err;
            }
            const fileName = tableName + ".tsv";
            fs.writeFile(fileName, output, err => {
              if (err) {
                throw err;
              }
              resolve(fileName);
            });
          });
        })
    )
  );
  await new Promise(resolve =>
    exec(
      `"${join(binPath, "mysqlimport")}" -u ${user} -p${password} -L --delete shybyd ${fileNames.join(" ")}`,
      err => {
        fileNames.forEach(fs.unlinkSync);
        if (err) {
          throw err;
        }
        resolve();
      }
    )
  );
};
