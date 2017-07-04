import * as fs from 'fs';

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

export { parse_input }