import * as rp from 'request-promise';
import * as moment from 'moment';
import * as cheerio from 'cheerio';
import * as _ from 'lodash';
import * as url from 'url';

import * as Util from '../util';

/**
 * 
 * @description crawl gsdata weixin article list
 * input: weixiner -> username, gsdata id
 * output: resp -> status, message, articles
 * status: 0 -> init, 200 -> success, 300 -> no article, 301 - forbid, 400 - error
 * 
 */
const crawl_articles = async (weixiner) => {
  try {
    let resp = {
      status: 0,
      message: '',
      articles: []
    };
    let {username, gs_id} = weixiner,
      sorts = [-1, -2, -3],
      referer = `http://www.gsdata.cn/rank/wxdetail?wxname=${gs_id}`;
    console.log('[gsdata] check link -->', referer);
    for (let sort of sorts) {
      let uri = `http://www.gsdata.cn/rank/toparc?wxname=${gs_id}&wx=${username}&sort=${sort}`;
      console.log('[gsdata] data link -->', uri);
      let options = {
        method: 'POST',
        uri,
        timeout: 1000 * 60 * 2,
        headers: {
          'Host': 'www.gsdata.cn',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
          'Cookie': 'bdshare_firstime=1475892937129; 7299d75074d00968e78c687fc7b5317c=62d7500cb23d1f901a97391aa3707de48f819e6ba%3A4%3A%7Bi%3A0%3Bs%3A5%3A%2240116%22%3Bi%3A1%3Bs%3A14%3A%22soonfy%40163.com%22%3Bi%3A2%3Bi%3A604800%3Bi%3A3%3Ba%3A0%3A%7B%7D%7D; PHPSESSID=tbn7fkmi5qp429vnrgbom44592; _gsdataCL=WyI0MDExNiIsInNvb25meUAxNjMuY29tIiwiMjAxNjEwMTQwOTEwMjQiLCJkZjRlZmI3ODg0YjZhNWZmYTQ4NTdhMDBhMjQxMGRlOSJd; Hm_lvt_293b2731d4897253b117bb45d9bb7023=1476177012,1476234225,1476342173,1476407429; Hm_lpvt_293b2731d4897253b117bb45d9bb7023=1476407440',
          'Referer': referer,
          'X-Requested-With': 'XMLHttpRequest',
        }
      }
      let body = await rp(options);
      let data = JSON.parse(body);
      // console.log(data);
      if (data.error === 0) {
        // success
        let articles = data.data;
        articles = articles.map(x => {
          let last_modified_at = new Date(x.posttime);
          if (!last_modified_at.getTime()) {
            if (x.posttime_date.trim().length === 8) {
              let date = x.posttime_date;
              last_modified_at = new Date(date.slice(0, 4), date.slice(4, 6), date.slice(6));
            } else {
              last_modified_at = new Date(x.add_time);
            }
          }
          let stat_read_count = x.readnum_newest,
            stat_like_count = x.likenum_newest;
          stat_read_count = typeof stat_read_count === 'string' && stat_read_count.trim() === '10万+' ? 100001 : stat_read_count;
          stat_like_count = typeof stat_like_count === 'string' && stat_like_count.trim() === '10万+' ? 100001 : stat_like_count;
          stat_read_count = parseInt(stat_read_count) || 0;
          stat_like_count = parseInt(stat_like_count) || 0;
          let temp
          if (stat_read_count > 0) {
            temp = {
              uri: x.url || '',
              title: x.title || '',
              last_modified_at,
              crawled_at: new Date(),
              stat_content_crawled_status: 0,
              stat_info_crawled_status: 1,
              stat_info_crawled_by: 1,
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
              stat_content_crawled_status: 0,
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
        resp.message += sort + '; ';
        resp.articles = _.concat(resp.articles, articles);
      } else if (data.error_msg.includes('禁止访问') && sort === -1) {
        // forbid ip
        resp.status = 401;
        resp.message = 'gsdata forbid, sleep 10m restart.';
      } else if (data.error_msg.includes('暂无数据')) {
        // forbid ip
        console.log(data);
        resp.status = 300;
        resp.message = 'weixin gsdata no data.';
      } else {
        console.log(data);
        resp.status = 400;
        resp.message = data.error_msg;
      }
    }
    console.log(`[gsdata] weixin ${weixiner.username} over.`);
    // console.log(resp);
    return resp;
  } catch (error) {
    console.error(error);
    console.error(`[gsdata] crawl has error. sleep 20s restart.`);
    await Util.sleep(20);
    return await crawl_articles(weixiner);
  }
}

/**
 * 
 * @description crawl gsdata weixin id
 * input: weixiner -> username
 * output: gsdata id
 * 
 */
const crawl_id = async (weixiner) => {
  try {
    let gs_id;
    let {username} = weixiner,
      referer = 'http://www.gsdata.cn/',
      source = `http://www.gsdata.cn/query/wx?q=${username}`,
      uri = `http://www.gsdata.cn/query/ajax_wx?q=${username}&page=1&types=all&industry=all`;
    console.log(`[gsdata] check uri -->`, source);
    console.log(`[gsdata] data uri -->`, uri);
    let options = {
      resolveWithFullResponse: true,
      encoding: null,
      gzip: true,
      uri,
      timeout: 1000 * 60 * 2,
      headers: {
        'Host': 'www.gsdata.cn',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
        'Cookie': 'bdshare_firstime=1475892937129; 7299d75074d00968e78c687fc7b5317c=62d7500cb23d1f901a97391aa3707de48f819e6ba%3A4%3A%7Bi%3A0%3Bs%3A5%3A%2240116%22%3Bi%3A1%3Bs%3A14%3A%22soonfy%40163.com%22%3Bi%3A2%3Bi%3A604800%3Bi%3A3%3Ba%3A0%3A%7B%7D%7D; PHPSESSID=tbn7fkmi5qp429vnrgbom44592; _gsdataCL=WyI0MDExNiIsInNvb25meUAxNjMuY29tIiwiMjAxNjEwMTQwOTEwMjQiLCJkZjRlZmI3ODg0YjZhNWZmYTQ4NTdhMDBhMjQxMGRlOSJd; Hm_lvt_293b2731d4897253b117bb45d9bb7023=1476177012,1476234225,1476342173,1476407429; Hm_lpvt_293b2731d4897253b117bb45d9bb7023=1476407440',
        'Referer': referer,
        'X-Requested-With': 'XMLHttpRequest',
      }
    }
    let res = await rp(options);
    let body = res.body.toString();
    let data = JSON.parse(body).data;
    let $ = cheerio.load(data);
    let lis = $('.list_query');
    let reg = /wxname=([\w\d]+)/;
    lis.map((_i, _e) => {
      if ($(_e).find('.wxname').text().trim() === username) {
        let match = $('#nickname').attr('href').match(reg);
        if (match) {
          gs_id = match[1];
        }
      }
    })
    // console.log(gs_id);
    return gs_id;
  } catch (error) {
    console.error(error);
  }
}

// crawl_articles({ username: 'rmrbwx', gs_id: 'cQmB1DySYJnqdi4n' });
// crawl_id({ username: 'rmrbwx' });

export {
  crawl_articles,
  crawl_id
}