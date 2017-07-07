import * as elasticsearch from 'elasticsearch';
import * as moment from 'moment';

import Config from '../config';
import * as WXCrawler from '../crawlers/weixin_crawler';
import * as Util from '../util';

const client = new elasticsearch.Client({
  hosts: [Config.es.uri]
});

const start = async () => {
  console.log(`get weixin articles...`);
  let resp = {
    status: 0,
    type: 'article',
    data: null,
    uri: '',
    message: '',
    stamp: Date.now()
  }
  try {
    let searchParams = {
      index: Config.es.index,
      type: Config.es.type,
      size: 10,
      q: `stat_content_crawled_status:0`,
      sort: 'crawled_at:asc',
    };
    let result = await client.search(searchParams);
    if (result.hits && result.hits.hits.length > 0) {
      let articles = result.hits.hits.map(x => x._source);
      // console.log(articles);
      let promises = articles.map(async (article) => await WXCrawler.crawl_content(article));
      let docs = await Promise.all(promises);
      // console.log(docs);
      let status = await Util.bulk(docs);
        if (status.success === 'true') {
          console.log(`[gsdata] weixin articles crawl over.`);
        } else {
          console.log(`[gsdata] bulk status`, status);
        }
    } else {
      console.log(`[content] all articles crawled content. sleep 10m restart.`);
      await Util.sleep(60 * 10);
    }
  } catch (error) {
    console.error(error);
    return await start();
  }
}

import * as mongoose from 'mongoose';
import * as monitor from 'monitor-node';
const connection = mongoose.createConnection(Config.monitor.uris);

const floop = async () => {
  console.log(Config);
  while (true) {
    await start();
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
    let task = await monitor.update(connection);
    console.log(task);
  }
}

// start();
floop();