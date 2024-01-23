import React, { useEffect, useRef } from 'react';
import { Button, Select } from 'antd';
import * as docx from 'docx-preview';
import request from "../../utils/request";
import './previewStyle.less';

const PreviewTxt = ({ url }) => {
  console.log('url--doc', url);
  const docRef = useRef(null);

  useEffect(() => {
    request({
      method: 'get',
      url,
      responseType: 'blob'
    }).then(res => {
      if (res) {
        docx.renderAsync(res, docRef.current);
      }
    })
  }, []);

  const changeEncode = (value) => {

  };

  const copy = () => {

  };

  return (
    <div className="code">
      <div className="top-op">
        <div className="encode-select">
          <Select allowClear onChange={changeEncode}>
            <Select.Option key="utf8">utf8编码</Select.Option>
            <Select.Option key="gbk">gbk编码</Select.Option>
          </Select>
          <div className="tips">乱码了？切换编码</div>
        </div>

        <div className="copy-btn">
          <Button type="primary" onClick={copy}>复制</Button>
        </div>
      </div>
    </div>
  );
};

PreviewTxt.defaultProps = {
  url: ''
};

export default PreviewTxt;
