import * as url from 'url';
import * as moment from 'moment';
import * as rp from 'request-promise';

import * as GSCrawler from '../crawlers/gsdata_crawler';
import * as WXCrawler from '../crawlers/weixin_crawler';
import * as Util from '../util';
import Weixiner from '../models/weixiner';
import Config from '../config';

const OFFSET = 1000 * 60 * 10;

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
      console.log(weixiner && weixiner.username);
      let resp = await GSCrawler.crawl_articles(weixiner);
      if (resp.status === 200) {
        let promises = resp.articles.map(async (article) => await WXCrawler.crawl_content(article))
        let docs = await Promise.all(promises);
        docs = docs.map(x => {
          x.index_name = Config.es.index;
          x.type_name = Config.es.type;
          return x;
        })
        // console.log(docs);
        console.log(`[gsdata] docs length ${docs.length}`);

        if (Config && Config.es && Config.es.uri) {
          let {host} = url.parse(Config.es.uri, true);
          // console.log(host);
          let options = {
            uri: `http://${host}/stq/api/v1/pa/weixin/add`,
            method: 'POST',
            body: docs,
            json: true,
            resolveWithFullResponse: true,
          };
          let respo = await rp(options);
          while (true) {
            console.log(respo.statusCode, respo.body);
            if (respo.statusCode === 200 && respo.body['success'] === 'true') {
              console.log(`[gsdata] weixin ${weixiner.username} crawl and store es over.`);
              break;
            }
            console.error(`[gsdata] no es uri. crawl but not store. es down. sleep 10m restore.`);
            await Util.sleep(60 * 10);
            respo = await rp(options);
          }
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
          respo = null;
          options = null;
          host = null;
        } else {
          console.error(`[gsdata] no es uri. crawl but not store. no es uri.`);
        }
        docs = null;
        promises = null;
      } else if (resp.status === 100) {
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

const floop = async () => {
  console.log(Config);
  while (true) {
    await start();
    console.log('[gsdata] sleep 20s restart.');
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
    // let task = await monitor.update(mongoose);
    // console.log(task);
    await Util.sleep(20);
  }
}

start();
// floop();
