/**
 *
 *  delete error weixin content
 *
 */
import * as elasticsearch from 'elasticsearch';
import * as moment from 'moment';

import Config from '../config';
import * as WXCrawler from '../crawlers/weixin_crawler';
import * as Util from '../util';

const client = new elasticsearch.Client({
  hosts: [Config.es.uri]
});

const start = async () => {
  console.log(`delete weixin articles...`);
  try {
    let searchParams = {
      index: Config.es.index,
      type: Config.es.type,
      size: 10,
      body: {
        // "query": {
        //   "bool": {
        //     "must_not": [
        //       {
        //         "exists": {
        //           "field": "mid"
        //         }
        //       }
        //     ]
        //   }
        // }
        "query": {
          "bool": {
            "filter": [{
              "term": {
                "sn": "undefined"
              }
            }]
          }
        }
      },
      // q: `stat_content_crawled_status:0`,
      sort: 'crawled_at:asc',
    };
    let result = await client.search(searchParams);
    // console.log(result.hits.hits);
    console.log('hits', result.hits.hits[0]);
    let promises = result.hits.hits.map(async (x) => {
      if (x._id.includes(':undefined') || x._id.includes('NaN')) {
        let deleteParams = {
          index: Config.es.index,
          type: Config.es.type,
          id: x._id,
        };
        console.log(x._id);
        let res = await client.delete(deleteParams);
        console.log(res);
        return res;
      } else {
        console.error(x._id);
      }
    })
    let resp = await Promise.all(promises);
    console.log(`all deleted.`);
  } catch (error) {
    console.error(error);
    // return await start();
  }
}


start();