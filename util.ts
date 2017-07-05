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

const sleep = async (s = 20) => {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000 * s);
  })
}

const attr = async (object) => {
  let temp = {};
  for (let pro in object) {
    if (object[pro]) {
      temp[pro] = object[pro];
    }
  }
  return temp;
}

export { parse_input, sleep, attr }