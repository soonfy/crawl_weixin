import * as Util from '../util';
import * as SogouCrawler from '../crawlers/sogou_crawler';
import Config from '../config';
import Weixiner from '../models/weixiner';

const start = async () => {
  try {
    console.log(Config);
    let argvs = process.argv.slice(2);
    if (argvs.length === 0) {
      console.error(`缺少其他参数。 file path...`);
      process.exit();
    }
    let file_weixin = argvs[0];
    let data = Util.parse_input(file_weixin);
    // console.log(data);
    for (let weixin of data) {
      console.log('===========================');
      console.log(weixin);
      if (weixin.match(/^https?\:\/\/mp\.weixin\.qq\.com\//)) {
        let _id = await SogouCrawler.crawl_biz_uri(weixin);
        console.log(`biz, ${_id}`);
        if (_id) {
          let _weixin = await Weixiner.findOne({ _id });
          if (_weixin) {
            console.log(`weixin ${weixin} already has.`);
            continue;
          }
          let _user = {
            _id,
            created_at: new Date(),
            crawled_status: 0,
            crawled_at: Date.now() - 1000 * 60 * 60 * 24,
            gs_crawled_status: 0,
            gs_crawled_at: Date.now() - 1000 * 60 * 60 * 24,
            nr_crawled_status: 0,
            nr_crawled_at: Date.now() - 1000 * 60 * 60 * 24
          }
          let re_user = await Weixiner.create(_user);
          console.log(re_user);
          console.log(`weixin ${re_user._id} has store.`);
        } else {
          console.error(`weixin ${weixin} not find biz.`);
        }
      } else {
        let _weixin = await Weixiner.findOne({ username: weixin });
        if (_weixin) {
          console.log(`weixin ${weixin} already has.`);
          continue;
        }
        let user = await SogouCrawler.crawl_biz_username(weixin);
        console.log(user);
        if (user && user._id) {
          let _user = {
            _id: user._id,
            username: user.username,
            name: user.name,
            intro: user.intro,
            created_at: new Date(),
            crawled_status: 0,
            crawled_at: Date.now() - 1000 * 60 * 60 * 24,
            gs_crawled_status: 0,
            gs_crawled_at: Date.now() - 1000 * 60 * 60 * 24,
            nr_crawled_status: 0,
            nr_crawled_at: Date.now() - 1000 * 60 * 60 * 24
          }
          // let re_user = await Weixiner.create(_user);
          // console.log(re_user);
          // console.log(`weixin ${re_user._id} has store.`);
        } else {
          console.error(`weixin ${weixin} not find biz.`);
        }
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