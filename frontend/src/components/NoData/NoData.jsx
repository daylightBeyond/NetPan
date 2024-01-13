import React from 'react';
import Icon from "../Icon/Icon.jsx";
import './style.less';
const NoData = ({ msg }) => {
  return (
    <div className="no-data">
      <Icon iconName="no_data" width={120} fit="fill"/>
      <div className="msg">{msg}</div>
    </div>
  );
};

NoData.defaultProps = {
  msg: '暂无数据',
};

export default NoData;
