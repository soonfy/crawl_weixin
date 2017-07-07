import * as url from 'url';
import * as rp from 'request-promise';
import * as cheerio from 'cheerio';

import * as Util from '../util';

/**
 * 
 * @description crawl weixin content
 * input: article -> uri, biz, mid, idx, sn
 * output: article -> title, content
 * 
 */
const crawl_content = async (article) => {
  try {
    if (!article.uri) {
      article.uri = `http://mp.weixin.qq.com/s?__biz=${article.biz}&mid=${article.mid}&idx=${article.idx}&sn=${article.sn}`;
    }
    let doc = {
      id: '',
      biz: '',
      mid: 0,
      idx: 0,
      sn: '',
      content: '',
      author: '',
      copyright: false,
      source: null,
      stat_content_crawled_status: 1,
      stat_content_crawled_at: new Date(),
    };

    let uri = article.uri;
    console.log(`[weixin] data uri -->`, uri);
    let {
      query
    } = url.parse(uri, true);
    doc.biz = query.__biz;
    doc.mid = parseInt(query.mid);
    doc.idx = parseInt(query.idx);
    doc.sn = query.sn;
    doc.id = `${doc.biz}:${doc.mid}:${doc.idx}`;

    let options = {
      method: 'GET',
      uri,
      timeout: 1000 * 60,
      headers: {
        'Host': 'mp.weixin.qq.com',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
      }
    }
    let body = await rp(options);
    while (true) {
      if (body.includes('<p class="tips">接相关投诉，此内容违反《即时通信工具公众信息服务发展管理暂行规定》')) {
        console.error(`[weixin] 接相关投诉，此内容违反《即时通信工具公众信息服务发展管理暂行规定》`);
        body = '';
        break;
      } else if (body.includes('该内容已被发布者删除')) {
        console.error(`[weixin] 该内容已被发布者删除`);
        body = '';
        break;
      } else if (body.includes('此内容因违规无法查看')) {
        console.error(`[weixin] 此内容因违规无法查看`);
        body = '';
        break;
      } else if (body.includes('<p class="title">此帐号在冻结期,内容无法查看</p>')) {
        console.error(`[weixin] 此帐号在冻结期,内容无法查看`);
        body = '';
      } else if (body.includes('<div class="icon_area"><i class="icon_msg warn"></i></div>')) {
        if (body.includes('操作过于频繁，请稍后再试。')) {
          console.error(`[weixin] 操作过于频繁，请稍后再试。`);
          console.error(`sleep 10m restart.`);
          await Util.sleep(60 * 10);
          body = await rp(options);
        } else {
          console.error(`[weixin] 此内容因违规无法查看`);
          body = '';
          break;
        }
      } else {
        console.log(`[weixin] 获得文章内容。`);
        break;
      }
    }
    if (body) {
      let $ = cheerio.load(body);
      let meta = $('em.rich_media_meta_text').text().trim() || '';
      doc.author = meta.replace(/\d{4}\-\d{2}\-\d{2}/, '');
      doc.content = $('#js_content').text().trim();
      doc.copyright = $('#copyright_logo').length > 0 ? true : false;
      let name = $('.original_cell .flex_cell_primary').text().trim();
      if (name) {
        doc.source = {};
        let match = body.match(/source_encode_biz\s*=\s*\"([\w\W]*?)\";/);
        if (match) {
          doc.source.biz = match[1];
        }
        match = body.match(/source_mid\s*=\s*\"(\d*?)\";/);
        if (match) {
          doc.source.mid = parseInt(match[1]);
        }
        match = body.match(/source_idx\s*=\s*\"(\d*?)\";/);
        if (match) {
          doc.source.idx = parseInt(match[1]);
        }
      }
    }
    // console.log(doc);
    return doc;
  } catch (error) {
    console.error(error);
    console.error(`[weixin] crawl content error. sleep 10s restart.`);
    await Util.sleep(10);
    return await crawl_content(article);
  }
}

export { crawl_content }

// crawl_content({uri: 'https://mp.weixin.qq.com/s?__biz=MjM5MjAxNDM4MA==&mid=2666161390&idx=3&sn=82a7336dc022f48efde6836c807d4030&scene=0#wechat_redirect'})
// crawl_content({uri: 'https://mp.weixin.qq.com/s?__biz=MjM5MTI0NjQ0MA==&mid=2655816649&idx=1&sn=f2832d9532c89198303852767f0645c3&scene=0#wechat_redirect'})
