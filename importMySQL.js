const stringify = require("csv-stringify");
const fs = require("fs");
const { exec } = require("child_process");

module.exports = async function(qxNames, stores) {
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
      `"C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqlimport.exe" -u shybyd1 -p -L --delete shybyd ${fileNames.join(" ")}`,
      err => {
        if (err) {
          throw err;
        }
        resolve();
      }
    )
  );
};
