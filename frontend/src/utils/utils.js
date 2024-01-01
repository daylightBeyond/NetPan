export const sizeToStr = (limit) => {
  let size = '';
  if (limit < 0.1 * 1024) {
    size = limit.toFixed(2) + 'B';                    // 小于0.1KB, 则转换成 B
  } else if (limit < 0.1 * 1024 * 1024) {
    size = (limit / 1024).toFixed(2) + 'KB';          // 小于0.1MB, 则转换成 KB
  } else if (limit < 0.1 * 1024 * 1024 * 1024) {
    size = (limit / (1024 * 1024)).toFixed(2) + 'MB'; // 小于0.1GB, 则转换成 MB
  } else {
    size = (limit / (1024 * 1024 * 1024)).toFixed(2) + 'GB'; // 其他转化成 GB
  }

  let sizeStr = size + ''; // 转换成字符串
  let index = sizeStr.indexOf('.');                       // 获取小数点出的索引
  let dou = sizeStr.substr(index + 1, 2);     // 获取小数点后的两位值
  if (dou == '00') {                                      // 判断后两位小鼠是否为 00, 如果是则删除 00
    return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2);
  }
  return size;
};
