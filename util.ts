import * as fs from 'fs';
import * as url from 'url';
import * as rp from 'request-promise';

import Config from './config';

/**
 *
 *  解析输入文件
 *
 */

const parse_input = (file_weixin) => {
  try {
    let data = fs.readFileSync(`./input/${file_weixin}.txt`, 'utf-8');
    // console.log(data);
    let lines = data.split('\n');
    lines = lines.map(x => x.trim());
    lines = lines.filter(x => x);
    return lines;
  } catch (error) {
    console.error(error);
  }
}

const sleep = async (s = 20) => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000 * s);
  })
}

const bulk = async (docs) => {
  try {
    if (Config && Config.es && Config.es.uri) {
      let {host} = url.parse(Config.es.uri, true);
      // console.log(host);
      if (!Array.isArray(docs)) {
        docs = [docs];
      }
      docs = docs.map(x => {
        x.index_name = Config.es.index;
        x.type_name = Config.es.type;
        return x;
      });
      console.log(docs);
      console.log(`[bulk] docs length`, docs.length);
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
          console.log(`[bulk] articles ${docs.length} bulk es over.`);
          break;
        } else {
          console.error(`[bulk] bulk es error. sleep 10m restore.`);
          await sleep(60 * 10);
          respo = await rp(options);
        }
      }
      let body = respo.body;
      options = null;
      host = null;
      return body;
    } else {
      console.error(`no config es uri...`);
    }
  } catch (error) {
    console.error(error);
    await bulk(docs);
  }
}

export { parse_input, sleep, bulk }
