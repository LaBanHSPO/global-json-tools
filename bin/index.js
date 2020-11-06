#!/usr/bin/env node

const fs = require('fs');
const Excel = require('exceljs')
const moment = require('moment');

try {
	if (process.argv.length < 4) {
		console.log(`============
Usage: jsonto input.json out.xlsx
============`);
		process.exit(0);
	}
    const inputFile = process.argv[2];
    const outputPath = process.argv[3];
    const existedFile =fs.existsSync(inputFile);
    if (!existedFile) {
        throw new Error('File is not exist')
    }
    console.log(`[JSON to XLSX] Reading files ${inputFile}....`);
    const fileContent = fs.readFileSync(inputFile);

    console.log('[JSON to XLSX] Parsed files...');
    let parsed = JSON.parse(fileContent);
    if (!Array.isArray(parsed)) throw new Error('Invalid input array');
    if (Array.isArray(parsed[0])) {
        parsed = parsed[0];
    }

    let workbook = new Excel.Workbook()

    let worksheet = workbook.addWorksheet('excel_data')

    console.log('COLUMNS: ', Object.keys(parsed[0]).map(i => ({ header: i, key: i })));

    worksheet.columns = Object.keys(parsed[0]).map(i => ({ header: i, key: i }));

    worksheet.columns.forEach(column => {
        column.width = column.header.length < 12 ? 12 : column.header.length
    });

    worksheet.getRow(1).font = { bold: true }

    // Dump all the data into Excel
    parsed.forEach((e, index) => {
        // row 1 is the header.
        const rowIndex = index + 2

        // By using destructuring we can easily dump all of the data into the row without doing much
        // We can add formulas pretty easily by providing the formula property.
        worksheet.addRow({
            ...e,
            // GIO_DEN: e.GIO_DEN && moment(e.GIO_DEN).format('DD-MM-YYYY HH:mm'),
            // GIO_HOANTHANH: e.GIO_HOANTHANH && moment(e.GIO_HOANTHANH).format('DD-MM-YYYY HH:mm')
        });
    });
    console.log('[JSON to XLSX] Writing file ...');
    workbook.xlsx.writeFile(outputPath);
    console.log('[JSON to XLSX] Done');

} catch (err) {
    console.log('[ERROR]', err.message);
}
