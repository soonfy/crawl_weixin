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
    console.error(`配置文件 config.json 路径没找到`);
    process.exit();
  }
}
// console.log(Config);
let db = Config && Config.db && Config.db.uris;
mongoose.connect(db);

export default Config;