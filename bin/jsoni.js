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
	if (process.argv.length < 6) {
		console.log(`=======Insert Many
Usage: jsoni tbl_name in.xlsx 
============`)
		process.exit(0);
	}
    const configContent = fs.readFileSync(path.join(process.cwd(), 'env.config.json'), 'utf-8');
    const config = JSON.parse(configContent);
    const table = process.argv[3];   
    const fileIn = process.argv[4];
    const fileOut = process.argv[5];

    const workbook = new Excel.Workbook();
    const options = {
          dateFormats: ['DD/MM/YYY hh:mm:ss']
    }

    workbook.xlsx.readFile(fileIn, options).then(() => {
     
        const worksheet = workbook.worksheets[0];  
        let headers = worksheet.getRow(1).values;
      
        console.log('Processing sheet: ', fileIn, worksheet.name, headers);

        const prepareData = [];
        for (let rowIndex = 2; rowIndex <= worksheet.lastRow.number; rowIndex++) {
            const cursorRow = worksheet.getRow(rowIndex).values;
            const row = headers.reduce((total, current, idx) => {
                if (!current) return total;

                const field = String(current).split('__')[0];
                const ctl = String(current).split('__')[1];
                if (ctl === 'D') {
                     total[field] = `TO_DATE('${dateUtil(cursorRow[idx]).utc().format('DD/MM/YYYY hh:mm:ss')}', 'DD/MM/YYYY HH24:MI:SS')`;
                } else {
                     total[field] = cursorRow[idx];
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
    });
} catch (err) {
    console.log('[ERROR]', err.message);
    console.log(err);
}
