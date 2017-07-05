import * as cheerio from 'cheerio';
import * as rp from 'request-promise';

const crawl_cookie = async () => {
  try {
    console.log(`crawl sogou cookie...`);
    let uri = encodeURI(`https://www.sogou.com/web?query=数太奇`);
    let options = {
      uri,
      method: 'GET',
      resolveWithFullResponse: true,
      timeout: 1000 * 60 * 2,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
        'Host': 'www.sogou.com',
      },
    };
    let resp = await rp(options);
    // console.log(resp.body);
    let cookies = resp.headers['set-cookie'];
    // console.log(cookies);
    let cookieo = {};
    cookies.map(x => {
      let strs = x.split(/;\s*/);
      strs.map(y => {
        let attr = y.split(/=/)[0].trim();
        let value = y.split(/=/)[1].trim();
        cookieo[attr] = value;
      })
    })
    let cookie = '';
    for (let attr in cookieo) {
      cookie += [attr, cookieo[attr]].join('=') + '; ';
    }
    console.log(cookie);
    return cookie;
  } catch (error) {
    console.error(error);
  }
}

const parse_users = ($) => {
  try {
    let lis = $('.news-list2 > li');
    let users = lis.map((i, v) => {
      let name = $(v).find('.tit').children('a').text().trim();
      let username = $(v).find('.info').children('label').text().trim();
      let useruri = $(v).find('.tit').children('a').attr('href').trim();
      let intro = $(v).find('dl').first().find('dd').text().trim();
      let articleuri = '',
        aa = $(v).find('dl').last().find('a');
      if (aa.length > 0) {
        articleuri = aa.attr('href').trim();
      }
      return {
        name,
        username,
        useruri,
        intro,
        articleuri
      }
    })
    return users.toArray();
  } catch (error) {
    console.error(error);
  }
}

const crawl_user_username = async (username) => {
  try {
    console.log(`crawl user by username.`);
    let cookie = await crawl_cookie();
    let uri = `http://weixin.sogou.com/weixin?type=1&query=${username}&sst0=${Date.now()}`;
    uri = encodeURI(uri);
    console.log(uri);
    let options = {
      uri,
      method: 'GET',
      timeout: 1000 * 60 * 2,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
        'Host': 'weixin.sogou.com',
        'Cookie': cookie,
        'Referer': 'http://weixin.sogou.com/',
      },
    };
    let body = await rp(options);
    // console.log(body);
    let $ = cheerio.load(body);
    let users = parse_users($);
    // console.log(users);
    let user = null;
    users.map(x => {
      if (x && x.username === username || x.name === username) {
        user = x;
      }
    })
    // console.log(user);
    return user;
  } catch (error) {
    console.error(error);
  }
}

const crawl_user_uri = async (uri) => {
  try {
    console.log(`crawl user by uri.`);
    console.log(uri);
    let reg_biz = /var\s*biz\s*=\s*\"(.*)\"\s*\|\|\s*\"(.*)\"\;/;
    let match = uri.match(/^https?\:\/\/mp\.weixin\.qq\.com\/s\?\_\_biz\=([\w\d=]+)\&/);
    let options = {
      uri,
      method: 'GET',
      timeout: 1000 * 60 * 2,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
        'Host': 'mp.weixin.qq.com',
      },
    };
    let body = await rp(options);
    // console.log(body);
    match = body.match(reg_biz);
    // console.log(match);
    let _id = match[1].trim() + match[2].trim();
    let $ = cheerio.load(body);
    let name = $('.profile_nickname').text().trim();
    let username, intro;
    let labels = $('.profile_meta_label');
    labels.map((i, v) => {
      if ($(v).text().includes('微信号')) {
        username = $(v).next().text().trim();
      } else if ($(v).text().includes('功能介绍')) {
        intro = $(v).next().text().trim();
      }
    })
    return { _id, username, name, intro };
  } catch (error) {
    console.error(error);
  }
}

const crawl_biz_username = async (username) => {
  try {
    console.log(`crawl biz by username.`);
    let user = await crawl_user_username(username);
    // console.log(user);
    if (user) {
      let temp = await crawl_user_uri(user.articleuri || user.useruri);
      user = Object.assign(user, temp);
    } else {
      console.error(`sogou weixin no ${username}`);
      return;
    }
    let {_id, name, intro} = user;
    // console.log(user);
    return { _id, username, name, intro };
  } catch (error) {
    console.error(error);
  }
}

// crawl_cookie();
// crawl_user_username('rmrbwx');
// crawl_user_username('人民日报');
// crawl_biz_username('rmrbwx');

export {
  crawl_user_uri,
  crawl_biz_username
}
