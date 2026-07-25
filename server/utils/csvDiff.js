const fs = require('fs');
const csv = require('csv-parser');

/**
 * Rapidly scans a CSV to get headers and row count.
 * Efficient even for large files as it streams.
 */
const scanCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        let headers = [];
        let rowCount = 0;
        let readHeaders = false;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (h) => {
                headers = h;
                readHeaders = true;
            })
            .on('data', () => {
                rowCount++;
            })
            .on('end', () => {
                resolve({ headers, rowCount });
            })
            .on('error', (err) => reject(err));
    });
};

exports.compareDatasets = async (pathA, pathB) => {
    const [metaA, metaB] = await Promise.all([
        scanCSV(pathA),
        scanCSV(pathB)
    ]);

    // 1. Schema Diff
    const addedCols = metaB.headers.filter(x => !metaA.headers.includes(x));
    const removedCols = metaA.headers.filter(x => !metaB.headers.includes(x));

    // 2. Row Diff
    const rowDelta = metaB.rowCount - metaA.rowCount;

    return {
        schemaChange: {
            added: addedCols,
            removed: removedCols,
            isIdentical: addedCols.length === 0 && removedCols.length === 0
        },
        rows: {
            old: metaA.rowCount,
            new: metaB.rowCount,
            delta: rowDelta > 0 ? `+${rowDelta}` : rowDelta.toString()
        }
    };
};
