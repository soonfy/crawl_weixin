import * as url from 'url';
import * as moment from 'moment';
import * as rp from 'request-promise';

import * as NRCrawler from '../crawlers/newrank_crawler';
import * as Util from '../util';
import Weixiner from '../models/weixiner';
import Config from '../config';

const OFFSET = 1000 * 60 * 10;

const start = async () => {
  try {
    // let weixiner = { username: 'hbs022-25803298'};
    let weixiner = await Weixiner.findOneAndUpdate({
      nr_crawled_status: 1,
      nr_crawled_at: {
        $lt: Date.now() - OFFSET
      }
    }, {
        $set: {
          nr_crawled_at: new Date()
        }
      }, {
        sort: {
          nr_crawled_at: 1
        },
        new: true
      });
    if (!weixiner) {
      weixiner = await Weixiner.findOneAndUpdate({
        nr_crawled_status: 0
      }, {
          $set: {
            nr_crawled_status: 1,
            nr_crawled_at: new Date()
          }
        }, {
          sort: {
            nr_crawled_at: 1
          }
        });
    }
    if (weixiner) {
      console.log(weixiner && weixiner.username);
      let nr_id = await NRCrawler.crawl_id(weixiner);
      console.log(nr_id);
      if (nr_id) {
        weixiner = await Weixiner.findOneAndUpdate({
          _id: weixiner._id,
          nr_crawled_status: 1
        }, {
            $set: {
              nr_id,
              nr_crawled_status: 2,
              nr_crawled_at: Date.now() - 1000 * 60 * 60 * 24 * 2
            }
          }, { new: true });
      } else {
        weixiner = await Weixiner.findOneAndUpdate({
          _id: weixiner._id,
          nr_crawled_status: 1
        }, {
            $set: {
              nr_id: '',
              nr_crawled_status: -1,
            }
          }, { new: true });
      }
      console.log(weixiner);
      console.log(`[newrank] weixin ${weixiner.username} newrank id update over.`);
      weixiner = null;
    } else {
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
      console.log('[newrank] all weixin weixin update gsdata id over. sleep 10m restart. exit.');
      // await Util.sleep(60 * 10);
      process.exit();
    }
  } catch (error) {
    console.error(error);
    console.error('[newrank] connect mongodb error. sleep 10m restart.');
    await Util.sleep(60 * 10);
  }
}

import * as mongoose from 'mongoose';
import * as monitor from 'monitor-node';
const connection = mongoose.createConnection(Config.monitor.uris);

const floop = async () => {
  console.log(Config);
  while (true) {
    await start();
    console.log('[newrank] sleep 20s restart.');
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
    let task = await monitor.update(connection);
    console.log(task);
    await Util.sleep(20);
  }
}

// start();
floop();
