#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Bluebird = require('bluebird');
 
fetch.Promise = Bluebird;

try {
    const cli = process.argv[2];
	if (process.argv.length < 4) {
		console.log(`Usage: 
			jsonto s1/s2 f/f1.txt f2.ext
		`)
		system.exit(0);
	}
    const configContent = fs.readFileSync(path.join(process.cwd(), 'env.config.json'), 'utf-8');
    const config = JSON.parse(configContent);
    console.log('CLI: ', cli,)
    const files = process.argv;
    files.splice(0, 3);
    console.log('Received files', files)
    const fileContents = [];
    for (const f of files) {
		const filePath = path.join(process.cwd(), f);
        const existedFile =fs.existsSync(filePath);
        if (!existedFile) {
            throw new Error('File is not exist')
        }
		const fContent = fs.readFileSync(filePath, 'utf-8');
        fContent && fileContents.push(fContent);
    }
        
    const body = { textLineArr: fileContents };
    fetch(`${cli === 's2' ? config.s2 : config.s1}`, {
            method: 'POST',
            body:    JSON.stringify(body),
            headers: config.restHeaders,
        })
        .then(res => res.json())
        .then(json => console.log(json));

} catch (err) {
    console.log('[ERROR]', err.message);
    console.log(err);
}
