import React from 'react';

const fileTUpeMap = {
  0: { desc: '目录', icon: 'folder' },
  1: { desc: '视频', icon: 'video' },
  2: { desc: '音频', icon: 'music' },
  3: { desc: '图片', icon: 'image' },
  4: { desc: 'exe', icon: 'pdf' },
  5: { desc: 'doc', icon: 'word' },
  6: { desc: 'excel', icon: 'excel' },
  7: { desc: '纯文本', icon: 'txt' },
  8: { desc: '程序', icon: 'code' },
  9: { desc: '压缩包', icon: 'zip' },
  10: { desc: '其他文件', icon: 'others' },
};

const Icon = (props) => {
  const {
    fileType,
    iconName,
    cover,
    width = 12,
    fit = 'cover',
  } = props;


  return (
    <span
      className="icon"
      style={{ width, height: width }}
    >
      <img style={{ objectFit: fit }}/>
    </span>
  );
};

export default Icon;