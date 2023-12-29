import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, Button, Input, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import useMergeState from "@/hooks/useMergeState";
import useHomeStore from '@/store/homeStore.js';
import useUploadFileStore from "@/store/uploadFileStore.js";
// import {} from '@/servers/main.js';
import '@/assets/file.list.less';

const Home = (props) => {
  const params = useParams();
  console.log('params', params);

  const [state, setState] = useMergeState({
    currentFolder: { fileId: 0 },
  });

  const { currentFolder } = state;

  // store的变量和方法
  const showUploader = useHomeStore(state => state.showUploader);
  const setShowUploader = useHomeStore(state => state.setShowUploader);
  const getUserAvatar = useHomeStore(state => state.getUserAvatar);
  const setFileData = useHomeStore(state => state.setFileData);

  const addFile = useUploadFileStore(state => state.addFile);

  /*
   * 由于Home组件和Uploader组件无任何关联，但是又需要点上传的时候触发 Uploader组件的方法，
   * 单靠组件间传值不方便处理，最好的方法是用状态管理
   */
  const customRequest = (options) => {
    console.log('options', options);
    const { file } = options;
    addFile({ file, filePid: currentFolder.fileId });
  };

  const uploadProps = {
    multiple: true,
    showUploadList: false,
    customRequest
  };

  return (
    <>
      <div className="top">
        <div className="top-op">
          <div className="btn">
            <Upload {...uploadProps}>
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

export default Home;
