/**
 *
 *  crawl newrank weixin
 *
 */

import * as moment from 'moment';

import * as NRCrawler from '../crawlers/newrank_crawler';
import * as Util from '../util';
import Config from '../config';
import Weixiner from '../models/weixiner';

const OFFSET = 1000 * 60 * 5;

const start = async () => {
  try {
    // let weixiner = { username: 'rmrbwx', nr_id: '04205A9952E24C3292871BA9F0E2852B' };
    let weixiner = await Weixiner.findOneAndUpdate({
      nr_crawled_status: 3,
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
        nr_crawled_status: 2
      }, {
          $set: {
            nr_crawled_status: 3,
            nr_crawled_at: new Date()
          }
        }, {
          sort: {
            nr_crawled_at: 1
          }
        });
    }
    if (weixiner) {
      console.log(`[newrank] weixin username`, weixiner && weixiner.username);
      let resp = await NRCrawler.crawl_articles(weixiner);
      if (resp.status === 200) {
        let docs = resp.articles.map(x => {
          x.index_name = Config.es.index;
          x.type_name = Config.es.type;
          return x;
        })
        // console.log(docs);
        console.log(`[newrank] docs length ${docs.length}`);
        let status = await Util.bulk(docs);
        if (status.success === 'true') {
          await Weixiner.findOneAndUpdate({
            _id: weixiner._id,
            nr_crawled_status: 3
          }, {
              $set: {
                nr_crawled_status: 2,
                nr_crawled_at: new Date()
              }
            });
          console.log(`[newrank] weixin ${weixiner.username} mongo status update over.`);
        } else {
          console.log(`[newrank] bulk status`, status);
        }
        status = null;
        docs = null;
      } else if (resp.status === 401 || resp.status === 400) {
        console.error(resp);
        console.error(`[newrank] crawl error. sleep 10m restart.`);
        await Util.sleep(60 * 10);
      } else {
        console.error(`[newrank] no catch error. need done.`);
        console.error(`[newrank] **************************`);
      }
      resp = null;
      weixiner = null;
    } else {
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
      console.log('[newrank] all weixin crawl over. sleep 10m restart.');
      await Util.sleep(60 * 10);
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
