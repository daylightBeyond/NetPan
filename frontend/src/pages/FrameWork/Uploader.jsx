import React, { useEffect } from 'react';
import { Progress } from 'antd';
import useMergeState from "@/hooks/useMergeState";
import useHomeStore from '@/store/homeStore.js';
import './style.less';

const Uploader = (props) => {
  console.log('上传区域props', props);
  // store的变量和方法
  const fileData = useHomeStore(state => state.fileData);
  const setFileData = useHomeStore(state => state.setFileData);
  const addFile = () => {
    const { fileId, filePid } = fileData;
    console.log('fileId', fileId);
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

      <div className="file-list">
        aaa
      </div>
    </div>
  );
};

export default Uploader;
