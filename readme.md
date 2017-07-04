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

## ensure weixin
  1. ready  
  txt 文件，每一行是微信号或者微信文章链接  

  2. run  
  ```
  node main/scripts/ensure_weixin.js <filename>
  or
  npm run ensure <filename>
  ```