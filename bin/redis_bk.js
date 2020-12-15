#!/usr/bin/env node
const Redis = require("ioredis");
const fs = require('fs');

const redis = new Redis({
  port: 2002, // Redis port
  host: "localhost", // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  // password: "xxx",
  db: 0,
});

const stream = redis.scanStream({
  match: "*PLAND6",
  // count: 100,
});

// redis.hmset('000PLAND6', 12, 'ABCD').catch(console.log);
const result = [];
async function run() {

  stream.on("data", async (resultKeys) => {
    // `resultKeys` is an array of strings representing key names.
    // Note that resultKeys may contain 0 keys, and that it will sometimes
    // contain duplicates due to SCAN's implementation in Redis.
    for (let i = 0; i < resultKeys.length; i++) {
      console.log('> KEY -- ', i+1, resultKeys[i]);
      const v = await redis.hgetall(resultKeys[i]);
      const value = Object.keys(v).reduce((total, key) => {
        total = [key, v[key], ...total];
        return total;
      }, []);
      result.push({
        key: resultKeys[i],
        value
      });
    }
  });
  stream.on("end", () => {
    console.log("all keys have been visited", result);
    fs.writeFileSync('./redis.json', JSON.stringify(result), 'utf8');
    process.exit(0);
  });

}

run();