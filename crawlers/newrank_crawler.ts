import * as crypto from 'crypto';
import * as rp from 'request-promise';
import * as moment from 'moment';
import * as _ from 'lodash';
import * as cheerio from 'cheerio';
import * as url from 'url';

import * as Util from '../util';

/**
 * 
 * @description crawl newrank weixin article list
 * input: weixiner -> username, newrank id
 * output: resp -> status, message, articles
 * status: 0 -> init, 200 -> success
 * 
 */
const crawl_articles = async (weixiner) => {
  try {
    let resp = {
      status: 0,
      message: '',
      articles: []
    };
    let {username, nr_id} = weixiner,
      referer = `http://www.newrank.cn/public/info/detail.html?account=${username}`,
      uri = `http://www.newrank.cn/xdnphb/detail/getAccountArticle`,
      a = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'],
      nonce = '';
    console.log('[newrank] check link -->', referer);
    for (let d = 0; d < 9; d++) {
      var e = Math.floor(16 * Math.random());
      nonce += a[e]
    }
    let xyz = `/xdnphb/detail/getAccountArticle?AppKey=joker&flag=true&uuid=${nr_id}&nonce=${nonce}`
    let hasher = crypto.createHash('md5');
    hasher.update(xyz);
    xyz = hasher.digest('hex');
    let form = {
      flag: 'true',
      uuid: nr_id,
      nonce: nonce,
      xyz: xyz
    };
    console.log(form);
    let options = {
      method: 'POST',
      uri,
      timeout: 1000 * 60 * 2,
      form,
      headers: {
        'Host': 'www.newrank.cn',
        'Origin': 'www.newrank.cn',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
        'Cookie': 'rmbuser=true; name=nr_7xn4h57or; token=E2AFB9B722EE685ACB18DF4ED1C1F1F8; useLoginAccount=true; OUTFOX_SEARCH_USER_ID_NCOO=1347608136.4589365; UM_distinctid=15b8e463cb8222-0efbf70e44e5cf-1d386853-1aeaa0-15b8e463cb97f9; rmbuser=true; name=nr_7xn4h57or; token=E2AFB9B722EE685ACB18DF4ED1C1F1F8; useLoginAccount=true; CNZZDATA1253878005=548603740-1487559940-%7C1496651071; Hm_lvt_a19fd7224d30e3c8a6558dcb38c4beed=1495503323; Hm_lpvt_a19fd7224d30e3c8a6558dcb38c4beed=1496655091',
        'Referer': referer
      }
    }
    let body = await rp(options);
    let json = JSON.parse(body);
    let articles = json.value.lastestArticle;
    articles = articles.map(x => {
      let last_modified_at = new Date(x.publicTime) || new Date(),
        stat_read_count = parseInt(x.clicksCount) || 0,
        stat_like_count = parseInt(x.likeCount) || 0;
      let temp;
      if (stat_read_count > 0) {
        temp = {
          uri: x.url || '',
          title: x.title || '',
          last_modified_at,
          crawled_at: new Date(),
          stat_content_crawled_status: 0,
          stat_info_crawled_status: 1,
          stat_info_crawled_by: 2,
          stat_info_crawled_at: new Date(),
          stat_interval: Date.now() - last_modified_at.valueOf(),
          stat_read_count,
          stat_like_count,
        }
      } else {
        temp = {
          uri: x.url || '',
          title: x.title || '',
          last_modified_at,
          crawled_at: new Date(),
          stat_info_crawled_status: 0,
        }
      }
      let {
        query
      } = url.parse(temp.uri, true);
      temp.biz = query.__biz;
      temp.mid = parseInt(query.mid);
      temp.idx = parseInt(query.idx);
      temp.sn = query.sn;
      temp.id = `${temp.biz}:${temp.mid}:${temp.idx}`;
      return temp;
    })
    resp.status = 200;
    resp.message += 'lastestArticle; ';
    resp.articles = _.concat(resp.articles, articles);
    articles = json.value.topArticle;
    articles = articles.map(x => {
      let last_modified_at = new Date(x.publicTime) || new Date(),
        stat_read_count = parseInt(x.clicksCount) || 0,
        stat_like_count = parseInt(x.likeCount) || 0;
      let temp;
      if (stat_read_count > 0) {
        temp = {
          uri: x.url || '',
          title: x.title || '',
          last_modified_at,
          crawled_at: new Date(),
          stat_content_crawled_status: 0,
          stat_info_crawled_status: 1,
          stat_info_crawled_by: 2,
          stat_info_crawled_at: new Date(),
          stat_interval: Date.now() - last_modified_at.valueOf(),
          stat_read_count,
          stat_like_count,
        }
      } else {
        temp = {
          uri: x.url || '',
          title: x.title || '',
          last_modified_at,
          crawled_at: new Date(),
          stat_info_crawled_status: 0,
        }
      }
      let {
        query
      } = url.parse(temp.uri, true);
      temp.biz = query.__biz;
      temp.mid = parseInt(query.mid);
      temp.idx = parseInt(query.idx);
      temp.sn = query.sn;
      temp.id = `${temp.biz}:${temp.mid}:${temp.idx}`;
      return temp;
    })
    resp.status = 200;
    resp.message += 'topArticle; ';
    resp.articles = _.concat(resp.articles, articles);
    console.log(`[newrank] weixin ${weixiner.username} crawl over.`);
    // console.log(resp);
    return resp;
  } catch (error) {
    console.error(error);
    console.error(`[newrank] crawl has error. sleep 20s restart.`);
    await Util.sleep(20);
    return await crawl_articles(weixiner);
  }
}

/**
 * 
 * @description crawl newrank weixin id
 * input: weixiner -> username
 * output: newrank id
 * 
 */
const crawl_id = async (weixiner) => {
  try {
    let nr_id;
    let {username} = weixiner,
      referer = 'http://www.newrank.cn/',
      source = `http://www.newrank.cn/public/info/search.html?value=${username}&isBind=undefined`,
      uri = `http://www.newrank.cn/public/info/detail.html?account=${username}`;
    console.log(`[gsdata] check uri -->`, source);
    console.log(`[gsdata] data uri -->`, uri);
    let options = {
      uri,
      timeout: 1000 * 60 * 2,
      headers: {
        'Host': 'www.newrank.cn',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
        'Cookie': 'OUTFOX_SEARCH_USER_ID_NCOO=1347608136.4589365; UM_distinctid=15b8e463cb8222-0efbf70e44e5cf-1d386853-1aeaa0-15b8e463cb97f9; ticket=gQHh7zwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyclU1NzFLa0ljbTMxazJqdjFwMVYAAgTyRF9ZAwQQDgAA; rmbuser=true; name=nr_v0s9ax4xr; token=2C290C379751ADC20E9607F06EFBC7A2; useLoginAccount=true; CNZZDATA1253878005=548603740-1487559940-%7C1499412864; Hm_lvt_a19fd7224d30e3c8a6558dcb38c4beed=1498701333,1499051705; Hm_lpvt_a19fd7224d30e3c8a6558dcb38c4beed=1499416432',
        'Referer': referer,
      }
    }
    let body = await rp(options);
    // console.log(body);
    if (body.includes('自动屏蔽掉相关账号所有的访问权限') || body.includes('欢迎登录')) {
      console.log(body);
      console.log(`[newrank] update newrank id forbid. sleep 10m restart.`);
      await Util.sleep(60 * 10);
      return await crawl_id(weixiner);
    }
    let $ = cheerio.load(body);
    let div = $('div.more').first();
    let href = div.children('a').attr('href');
    let reg = /uuid=(\w+)/;
    let match = reg.exec(href);
    if (match) {
      nr_id = match[1];
    }
    // console.log(nr_id);
    return nr_id;
  } catch (error) {
    console.error(error);
  }
}

// crawl_articles({ username: 'rmrbwx', nr_id: '04205A9952E24C3292871BA9F0E2852B' });
// crawl_id({ username: 'rmrbwx' });

export {
  crawl_articles,
  crawl_id
}