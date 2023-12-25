import React from 'react';
import { Progress } from 'antd';
import useMergeState from "@/hooks/useMergeState";
import './style.less';

const Uploader = () => {
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