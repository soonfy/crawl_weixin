import * as mongoose from 'mongoose';

/**
 *
 *  配置文件
 *  数据库
 *
 */
let Config;
try {
  Config = require('../config.json');
} catch (error) {
  try {
    Config = require('./config.json');
  } catch (error) {
    console.error(`配置文件 config.json 路径没找到, 传递参数。`);
    Config = {
      db: {
        uris: process.argv[2].trim(),
      },
      monitor: {
        uris: process.argv[3].trim(),
      },
      es: {
        uri: process.argv[4].trim(),
      },
    }
    // process.exit();
  }
}
// console.log(Config);
let db = Config && Config.db && Config.db.uris;
mongoose.connect(db);

export default Config;