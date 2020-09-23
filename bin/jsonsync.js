#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Bluebird = require('bluebird');
const Excel = require('exceljs');
const dateUtil = require('moment');


const makeValue = (s) => {
    if (!s || s === 'NULL') return 'NULL';
    if (Number(s)) return Number(s);
    if (['TO_DATE'].some(v => s.includes(v))) return s;
    return `'${s}'`;
}

try {
    console.log(process.argv)
	if (process.argv.length < 4) {
		console.log(`=======Insert Many
Usage: jsonsync tbl_name in.json out.txt
============`)
		process.exit(0);
	}

    const table = process.argv[2];   
    const fileIn = process.argv[3];
    const fileOut = process.argv[4];

    const fileInContent = fs.readFileSync(path.join(process.cwd(), fileIn), 'utf-8');
    let parsed = JSON.parse(fileInContent);
    let headers = Object.keys(parsed[0]);
    if (!Array.isArray(parsed)) throw new Error('Invalid input array');
    if (Array.isArray(parsed[0])) {
        parsed = parsed[0];
        headers = Object.keys(parsed[0]);
    }
    console.log('Processing: ', fileIn, parsed.length, headers);

        const prepareData = [];

        for (let rowIndex = 0; rowIndex < parsed.length; rowIndex++) {
            const cursorRow = parsed[rowIndex];
            const row = headers.reduce((total, current) => {
                if (!current) return total;

                const field = String(current).split('__')[0];
                const ctl = String(current).split('__')[1];
                if (ctl === 'D' || ['000Z', '2020-', '2021-'].some(v => String(cursorRow[field]).includes(v))) {
                     total[field] = `TO_DATE('${dateUtil(cursorRow[field]).utc().format('DD/MM/YYYY hh:mm:ss')}', 'DD/MM/YYYY HH24:MI:SS')`;
                } else {
                     total[field] = cursorRow[field];
                }
                return total;
            }, {});
            prepareData.push(row);
        }
        headers = headers.filter(Boolean).map(i => String(i).split('__')[0]);
        const insertBody = prepareData.map(row => `INTO ${table} (${headers.join(',')}) 
            VALUES (${headers.map(h => makeValue(row[h])).join(',')})`);
            const insertStmt = `
            INSERT ALL
              ${insertBody.join('\n')}
            SELECT * FROM dual`;
        fs.writeFileSync(path.join(process.cwd(), fileOut), insertStmt);

} catch (err) {
    console.log('[ERROR]', err.message);
    console.log(err);
}
