import React from 'react';
import { getImage } from '@/servers/home';
import './style.less';

const fileTypeMap = {
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
    width,
    fit,
  } = props;

  const getCover = () => {
    // if (cover) {
    //   // 这里调用获取封面的接口
    //   return getImage({ cover });
    // }
    let icon = 'unknow_icon';
    if (iconName) {
      icon = iconName;
    } else {
      const iconMap = fileTypeMap[fileType];
      if (iconMap) {
        icon = iconMap['icon'];
      }
    }

    return new URL(`/src/assets/icon-image/${icon}.png`, import.meta.url).href;
  }

  return (
    <span
      className="icon"
      style={{ width, height: width }}
    >
      <img src={getCover()} style={{ objectFit: fit }} />
    </span>
  );
};

Icon.defaultProps = {
  fileType: 0,
  width: 12,
  fit: 'cover'
}

export default Icon;
