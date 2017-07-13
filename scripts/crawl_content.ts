/**
 *
 *  crawl weixin content
 *
 */

import * as elasticsearch from 'elasticsearch';
import * as moment from 'moment';

import WeixinerArticle from '../models/weixin_article';
import Config from '../config';
import * as WXCrawler from '../crawlers/weixin_crawler';
import * as Util from '../util';

const client = new elasticsearch.Client({
  hosts: [Config.es.uri]
});
const OFFSET = 1000 * 60 * 5;

const startES = async () => {
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
    return await startES();
  }
}

const startDB = async () => {
  console.log(`get weixin articles...`);
  try {
    let article = await WeixinerArticle.findOneAndUpdate({ stat_content_crawled_status: -1, stat_content_crawled_at: Date.now() - OFFSET }, { $set: { stat_content_crawled_at: new Date() } }, { sort: { stat_content_crawled_at: 1 }, new: true });
    if (!article) {
      article = await WeixinerArticle.findOneAndUpdate({ stat_content_crawled_status: 0, stat_info_crawled_by: 1 }, { $set: { stat_content_crawled_status: -1, stat_content_crawled_at: new Date() } }, { sort: { stat_content_crawled_at: 1 }, new: true });
    }
    if (!article) {
      console.log('all article crawl content.');
      return;
    }
    let doc = await WXCrawler.crawl_content(article);
    // console.log(doc);
    article = await WeixinerArticle.findOneAndUpdate({ _id: doc.id }, { $set: doc }, { new: true });
    console.log(article);
    article = article.toObject();
    article.id = article._id;
    delete article._id;
    let status = await Util.bulk([article]);
    if (status.success === 'true') {
      console.log(`[gsdata] weixin articles crawl and bulk over.`);
    } else {
      console.log(`[gsdata] bulk status`, status);
    }
  } catch (error) {
    console.error(error);
    return await startDB();
  }
}

import * as mongoose from 'mongoose';
import * as monitor from 'monitor-node';
const connection = mongoose.createConnection(Config.monitor.uris);

const floop = async () => {
  console.log(Config);
  while (true) {
    // await startES();
    await startDB();
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'));
    let task = await monitor.update(connection);
    console.log(task);
  }
}

// startES();
// startDB();
floop();