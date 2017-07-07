const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const weixinArticle = new Schema({
  _id: {
    type: String,
  },
  biz: {
    type: String,
  },
  mid: {
    type: String,
  },
  idx: {
    type: Number,
  },
  sn: {
    type: String,
  },
  title: {
    type: String,
  },
  last_modified_at: {
    // 发布时间
    type: Date,
  },
  crawled_at: {
    type: Date,
  },

  // crawl content
  content: {
    type: String,
  },
  author: {
    type: String,
  },
  copyright: {
    // 原创
    type: Boolean,
  },
  source: {
    // 转载信息
    type: Object,
  },
  stat_content_crawled_status: {
    // 0 - 没采集到内容, 1 - 采集到文章内容
    type: Number,
  },
  stat_content_crawled_at: {
    // 内容采集时间
    type: Date,
  },


  // stat read
  stat_info_crawled_status: {
    // 0 - 没采集到阅读量, 1 - 采集到文章阅读量
    type: Number,
  },
  stat_info_crawled_by: {
    // 阅读量采集来源, 0 - 手机, 1 - gsdata, 2 - newrank
    type: Number,
  },
  stat_info_crawled_at: {
    // 阅读量采集时间
    type: Date,
  },
  stat_read_count: {
    type: Number,
  },
  stat_like_count: {
    type: Number,
  },
  stat_interval: {
    type: Number,
  },

  // other
  stat_real_read_num: {
    type: Number,
  },
  stat_ret: {
    type: Number,
  },

})
