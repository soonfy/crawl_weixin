/**
 *
 *  ensure gsdata weixin id
 *
 */

import * as url from 'url';
import * as moment from 'moment';
import * as rp from 'request-promise';

import * as GSCrawler from '../crawlers/gsdata_crawler';
import * as Util from '../util';
import Weixiner from '../models/weixiner';
import Config from '../config';

const OFFSET = 1000 * 60 * 10;

const start = async () => {
  try {
    // let weixiner = { username: 'hbs022-25803298' };
    let weixiner = await Weixiner.findOneAndUpdate({
      gs_crawled_status: 1,
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
        gs_crawled_status: 0
      }, {
          $set: {
            gs_crawled_status: 1,
            gs_crawled_at: new Date()
          }
        }, {
          sort: {
            gs_crawled_at: 1
          }
        });
    }
    if (weixiner) {
      console.log(weixiner && weixiner.username);
      let gs_id = await GSCrawler.crawl_id(weixiner);
      if (gs_id) {
        weixiner = await Weixiner.findOneAndUpdate({
          _id: weixiner._id,
          gs_crawled_status: 1
        }, {
            $set: {
              gs_id,
              gs_crawled_status: 2,
              gs_crawled_at: Date.now() - 1000 * 60 * 60 * 24 * 2
            }
          }, { new: true });
      } else {
        weixiner = await Weixiner.findOneAndUpdate({
          _id: weixiner._id,
          gs_crawled_status: 1
        }, {
            $set: {
              gs_id: '',
              gs_crawled_status: -1,
            }
          }, { new: true });
      }
      console.log(weixiner);
      console.log(`[gsdata] weixin ${weixiner.username} gsdata id update over.`);
      gs_id = null;
      weixiner = null;
    } else {
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log('=======================stop============================');
      console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
      console.log('[gsdata] all weixin update gsdata id over. sleep 10m restart. exit.');
      // await Util.sleep(60 * 10);
      process.exit();
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

start();
// floop();
