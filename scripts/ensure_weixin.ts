/**
 *
 *  ensure weixin/gsdata/newrank weixin id
 *
 */

import * as Util from '../util';
import * as SogouCrawler from '../crawlers/sogou_crawler';
import * as GSCrawler from '../crawlers/gsdata_crawler';
import * as NRCrawler from '../crawlers/newrank_crawler';

import Config from '../config';
import Weixiner from '../models/weixiner';

const OFFSET = 1000 * 60 * 60 * 24 * 2;

const start = async () => {
  try {
    console.log(Config);
    let argvs = process.argv.slice(2);
    if (argvs.length === 0) {
      console.error(`缺少其他参数。 file name...`);
      process.exit();
    }
    let file_weixin = argvs[0];
    let data = Util.parse_input(file_weixin);
    // console.log(data);
    for (let weixin of data) {
      console.log('===========================');
      console.log(weixin);
      let user;
      if (weixin.match(/^https?\:\/\/mp\.weixin\.qq\.com\//)) {
        user = await SogouCrawler.crawl_user_uri(weixin);
      } else {
        user = await SogouCrawler.crawl_biz_username(weixin);
      }
      if (user && user._id) {
        console.log(user);
        let _weixin = await Weixiner.findOne({ _id: user._id });
        console.log(_weixin);
        if (_weixin) {
          console.log('weixin already exist, update.');
          _weixin = await Weixiner.findByIdAndUpdate(user._id, { $set: user }, { new: true });
          console.log(_weixin);
        } else {
          console.log('weixin not exist, insert.');
          user.created_at = new Date();
          user.crawled_status = 0;
          user.crawled_at = Date.now() - OFFSET;
          let gs_id = await GSCrawler.crawl_id(user);
          console.log(`gsdata id`, gs_id);
          if (gs_id) {
            user.gs_id = gs_id;
            user.gs_crawled_status = 2;
            user.gs_crawled_at = Date.now() - OFFSET;
          } else {
            user.gs_id = '';
            user.gs_crawled_status = -1;
            user.gs_crawled_at = new Date();
          }
          // let nr_id = await NRCrawler.crawl_id(user);
          // console.log(`newrank id`, nr_id);
          // if (nr_id) {
          //   user.nr_id = nr_id;
          //   user.nr_crawled_status = 2;
          //   user.nr_crawled_at = Date.now() - OFFSET;
          // } else {
          //   user.nr_id = '';
          //   user.nr_crawled_status = -1;
          //   user.nr_crawled_at = new Date();
          // }
          _weixin = await Weixiner.findByIdAndUpdate(user._id, { $set: user }, { upsert: true, new: true });
        }
        console.log(_weixin);
        console.log('ensure weixin success.');
      } else {
        console.error(`[ensure] ${weixin} no find user.`);
        process.exit();
      }
    }
    console.log('===========================');
    console.log(`all weixin ensure success.`);
    process.exit();
  } catch (error) {
    console.error(error);
  }
}

start();