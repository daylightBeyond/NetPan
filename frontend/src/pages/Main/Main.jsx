import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Button, Input, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
// import {} from '@/servers/main.js';
import '@/assets/file.list.less';

const Main = (props) => {
  const params = useParams();
  console.log('params', params);
  // useEffect(() => {
  //
  // }, []);
  return (
    <>
      <div className="top">
        <div className="top-op">
          <div className="btn">
            <Upload>
              <Button style={{ backgroundColor: '#409eff' }}>
                <span className="iconfont icon-upload">
                  上传
                </span>
              </Button>
            </Upload>
          </div>
          <Button style={{ backgroundColor: '#67c23a' }}>
            <span className="iconfont icon-folder-add">
              新建文件夹
            </span>
          </Button>
          <Button style={{ backgroundColor: '#fab6b6' }}>
            <span className="iconfont icon-del">
              批量删除
            </span>
          </Button>
          <Button style={{ backgroundColor: '#f3d19e' }}>
            <span className="iconfont icon-move">
              批量移动
            </span>
          </Button>
          <div className="search-panel">
            <Input placeholder="输入文件名搜索"/>
          </div>
          <div className="iconfont icon-refresh"></div>
        </div>
        {/* 导航 */}
        <div className="top-navigation">
          <span className="all-file">全部文件</span>
        </div>
      </div>
      <div className="file-list">
        {params.category}
      </div>
    </>
  );
};

export default Main;
