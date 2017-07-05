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
  crawled_status: {
    type: Number,
  },
  crawled_at: {
    type: Date,
  },

  // gsdata crawler
  gs_id: {                  //  crawl gsdata id
    type: String,
  },
  gs_crawled_status: {      //  crawl gsdata status
    type: Number,
  },
  gs_crawled_at: {          //  crawl gsdata date
    type: Date,
  },

  // newrank crawler
  nr_id: {                  //  crawl newrank id
    type: String,
  },
  nr_crawled_status: {      //  crawl newrank status
    type: Number,
  },
  nr_crawled_at: {          //  crawl newrank date
    type: Date,
  },

})

export default mongoose.model('WEIXINER', weixiner, 'weixiners');