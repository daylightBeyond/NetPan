import React, { useEffect } from 'react';
import { Progress } from 'antd';
import useHomeStore from '@/store/homeStore.js';
import useUploadFileStore from "@/store/uploadFileStore";
import './style.less';

const Uploader = (props) => {
  console.log('上传区域props', props);
  // store的变量和方法
  const fileData = useHomeStore(state => state.fileData);
  // const fileList = useHomeStore(state => state.fileList);
  const setFileData = useHomeStore(state => state.setFileData);

  const fileList = useUploadFileStore(state => state.fileList);
  const addFile = () => {
    const { file, filePid } = fileData;
    console.log('file', file);
    console.log('filePid', filePid);
  };

  useEffect(() => {
    addFile();
  }, [fileData]);

  return (
    <div className="uploader-panel">
      <div className="uploader-title">
        <span>上传任务</span>
        <span className="tips">（仅展示本次上传任务）</span>
      </div>

      {/* 文件列表区域 */}
      <div className="file-list">
        {fileList.length ? (
          fileList.map((item, index) => {
            return (
              <div>{index}</div>
            )
          })
        ) : (<span>暂无数据</span>)}
      </div>
    </div>
  );
};

export default Uploader;
