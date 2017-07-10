/**
 *
 *  crawl gsdata weixin
 *
 */

import * as moment from 'moment';

import * as GSCrawler from '../crawlers/gsdata_crawler';
import * as Util from '../util';
import Config from '../config';
import Weixiner from '../models/weixiner';

const OFFSET = 1000 * 60 * 5;

const start = async () => {
  try {
    // let weixiner = { username: 'hbs022-25803298', gs_id: 'aQGBJDzSMJDqIiynLgT5I211ODAzMjk4' };
    let weixiner = await Weixiner.findOneAndUpdate({
      gs_crawled_status: 3,
      gs_crawled_at: {
        $lt: Date.now() - OFFSET
      }
    }, {
        $set: {
          gs_crawled_at: new Date()
        }
      }, {
        sort: {
          gs_crawled_at: 1
        },
        new: true
      });
    if (!weixiner) {
      weixiner = await Weixiner.findOneAndUpdate({
        gs_crawled_status: 2
      }, {
          $set: {
            gs_crawled_status: 3,
            gs_crawled_at: new Date()
          }
        }, {
          sort: {
            gs_crawled_at: 1
          }
        });
    }
    if (weixiner) {
      console.log(`[gsdata] weixin username`, weixiner && weixiner.username);
      let resp = await GSCrawler.crawl_articles(weixiner);
      if (resp.status === 200) {
        let docs = resp.articles.map(x => {
          x.index_name = Config.es.index;
          x.type_name = Config.es.type;
          return x;
        })
        // console.log(docs);
        console.log(`[gsdata] docs length ${docs.length}`);
        let status = await Util.bulk(docs);
        if (status.success === 'true') {
          await Weixiner.findOneAndUpdate({
            _id: weixiner._id,
            gs_crawled_status: 3
          }, {
              $set: {
                gs_crawled_status: 2,
                gs_crawled_at: new Date()
              }
            });
          console.log(`[gsdata] weixin ${weixiner.username} mongo status update over.`);
        } else {
          console.log(`[gsdata] bulk status`, status);
        }
        status = null;
        docs = null;
      } else if (resp.status === 300) {
        console.error(resp);
        console.error(`[gsdata] weixin gsdata no data.`);
        await Weixiner.findOneAndUpdate({
          _id: weixiner._id,
          gs_crawled_status: 3
        }, {
            $set: {
              gs_crawled_status: -3,
              gs_crawled_at: new Date()
            }
          });
      } else if (resp.status === 401 || resp.status === 400) {
        console.error(resp);
        console.error(`[gsdata] crawl error. sleep 10m restart.`);
        await Util.sleep(60 * 10);
      } else {
        console.error(`[gsdata] no catch error. need done.`);
        console.error(`[gsdata] **************************`);
      }
      resp = null;
      weixiner = null;
    } else {
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
      console.log('[gsdata] all weixin crawl over. sleep 10m restart.');
      await Util.sleep(60 * 10);
    }
  } catch (error) {
    console.error(error);
    console.error('[gsdata] connect mongodb error. sleep 10m restart.');
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
    console.log('[gsdata] sleep 20s restart.');
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
    let task = await monitor.update(connection);
    console.log(task);
    await Util.sleep(20);
  }
}

// start();
floop();
