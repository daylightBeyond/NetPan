import React, { useEffect, useContext } from 'react';
import { Progress } from 'antd';
import useHomeStore from '@/store/homeStore.js';
import { BusContext, useListener } from '../../hooks/useBus';
import { useEventBus } from '../../hooks/useEventBus';
// import useListener from "../../hooks/useListener";
import useUploadFileStore from "@/store/uploadFileStore";
import PubSub from "pubsub-js";
import uploadStatus from "@/constants/upload-status.js";
import { sizeToStr } from '@/utils/utils';
import './style.less';
import pubSub from "../../utils/PubSub";

const Uploader = (props) => {
  console.log('上传区域props', props);

  // store的变量和方法
  const fileList = useUploadFileStore(state => state.fileList);

  return (
    <div className="uploader-panel">
      <div className="uploader-title">
        <span>上传任务</span>
        <span className="tips">（仅展示本次上传任务）</span>
      </div>

      {/* 文件列表区域 */}
      <div className="file-list">
        {fileList.map((item, index) => {
          return (
            <div key={index} className="file-item">
              <div className="upload-panel">
                <div className="file-name">
                  {item.fileName}
                </div>
                <div className="progress">
                  {(item.status == uploadStatus.uploading.value ||
                      item.status == uploadStatus.upload_finish.value ||
                      item.status == uploadStatus.upload_seconds.value) &&
                    <Progress percent={item.uploadProgress}/>
                  }
                  <Progress />
                </div>
                <div className="upload-status">
                  {/* 图标 */}
                  <span
                    className={`iconfont icon-${uploadStatus[item.status].icon}`}
                    style={{ color: uploadStatus[item.status].color }}
                  ></span>
                  {/* 状态描述 */}
                  <span className="status" style={{ color: uploadStatus[item.status].color }}>
                  {item.status == 'fail' ? item.errorMsg : uploadStatus[item.status].desc}
                </span>
                  {/*上传中*/}
                  {item.status == uploadStatus.uploading.value && (
                    <span className="upload-info">
                    { sizeToStr(item.uploadSize) }/{ sizeToStr(item.totalSize) }
                  </span>
                  )}
                </div>
              </div>
              <div className="op">
                {/*md5*/}
                {item.status == uploadStatus.init.value && (
                  <Progress
                    type="circle"
                    size={50}
                    percent={item.md5Progress}
                  />
                )}
                <div className="op-btn">
                <span>
                  <span className="btn-item">上传</span>
                </span>
                </div>
              </div>
            </div>
          )
        })}
        {fileList.length === 0 && (<span>暂无数据</span>)}
      </div>
    </div>
  );
};

export default Uploader;
