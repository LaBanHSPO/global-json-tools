#!/usr/bin/env node
const Redis = require("ioredis");
const fs = require('fs');

const redis = new Redis({
  port: 2002, // Redis port
  // host: "localhost", // Redis host
  host: "localhost", // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: "xxxx",
  db: 0,
});


async function run() {
  const data = fs.readFileSync('./redis.json');
  const updateList = JSON.parse(data);
  let cmd = redis.multi();
  for (let i of updateList) {
    cmd = cmd.hmset(i.key, i.value);
  }
  
  cmd
  .exec((err, results) => {
    console.log('RESULT', err, results);
    process.exit(0);
  });

}

run();