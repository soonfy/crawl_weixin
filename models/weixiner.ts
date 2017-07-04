import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;
const weixiner = new Schema({
  _id: {
    type: String,
  },
  username: {
    type: String,
  },
  
  // other
  name: {
    type: String,
  },
  intro: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: new Date(),
  },

  // crawler
  // 最近采集状态
  crawled_at: {
    type: Date,
    default: Date.now() - 1000 * 60 * 60 * 24,
  },
  // 采集状态
  crawled_status: {
    type: Number,
    default: 0,
  },

  // gsdata crawler
  gs_crawled_status: {      //  crawl gsdata status
    type: Number,
  },
  gs_crawled_at: {          //  crawl gsdata date
    type: Date,
  },

  // newrank crawler
  nr_crawled_status: {      //  crawl newrank status
    type: Number,
  },
  nr_crawled_at: {          //  crawl newrank date
    type: Date,
  },

})

export default mongoose.model('WEIXINER', weixiner, 'weixiners');