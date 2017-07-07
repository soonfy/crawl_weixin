# weixin

## ready
config.json
```
{
  "db":{
    "uris": [mongouri]
  }
}
```

## weixin crawler status

1. gsdata  

  ```
  初始 --> 0
  正在更新id --> 1
  公众号id更新成功 --> 2
  没有相同公众号 --> -1
  username = #########meta######### or '' ornull --> -2
  正在采集数据 --> 3
  采集报错 --> 4
  账号未收录 --> -3
  ```

2. newrank  

  ```
  初始 --> 0
  正在更新id --> 1
  公众号id更新成功 --> 2
  没有相同公众号 --> -1
  username = #########meta######### or '' or null --> -2
  正在采集数据 --> 3
  采集报错 --> 4
  ```


## scripts

### ensure weixin

数据库添加微信 id

  1. ready  
  txt 文件，每一行是微信号或者微信文章链接  

  2. run  
  ```
  node main/scripts/ensure_weixin.js <filename>
  or
  npm run ensure <filename>
  ```

### ensure gsdata

更新 gsdata id

  ```
  node main/scripts/ensure_gsdata.js
  ```

### ensure newrank

更新 newrank id

  ```
  node main/scripts/ensure_newrank.js
  ```

### crawl gsdata

采集 gsdata 网站数据

  ```
  node main/scripts/crawl_gsdata.js
  ```

### crawl newrank

采集 newrank 网站数据

  ```
  node main/scripts/crawl_newrank.js
  ```

### crawl content

采集文章内容

  ```
  node main/scripts/crawl_content.js
  ```