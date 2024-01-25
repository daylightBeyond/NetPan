import React, { useEffect, useContext, useState, forwardRef } from 'react';
import { Progress } from 'antd';
// 其他
import useUploadFileStore from "@/store/uploadFileStore";
import uploadStatus from "@/constants/upload-status.js";
// 组件
import Icon from "../../components/Icon/Icon.jsx";
import NoData from "../../components/NoData/NoData.jsx";
// 方法
import { sizeToStr } from '@/utils/utils';
// 样式
import './style.less';

const Uploader = forwardRef((props, ref) => {
  // store的变量和方法
  const fileList = useUploadFileStore(state => state.fileList);

  const startUpload = (uid) => {

  };

  const pauseUpload = (uid) => {

  };

  const delUpload = (uid, index) => {

  };

  return (
    <div ref={ref} className="uploader-panel">
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
                  {/* 上传中 */}
                  {item.status == uploadStatus.uploading.value && (
                    <span className="upload-info">
                      { sizeToStr(item.uploadSize) }/{ sizeToStr(item.totalSize) }
                    </span>
                  )}
                </div>
              </div>
              <div className="op">
                {/* md5 */}
                {item.status == uploadStatus.init.value && (
                  <Progress
                    type="circle"
                    size={40}
                    percent={item.md5Progress}
                  />
                )}
                <div className="op-btn">
                  {item.status == uploadStatus.uploading.value && (
                    <>
                      {item.pause ? (
                        <Icon
                          className="btn-item"
                          iconName="upload"
                          title="上传"
                          width={28}
                          onClick={() => startUpload(item.uid)}
                        />
                      ) : (
                        <Icon
                          className="btn-item"
                          iconName="pause"
                          title="暂停"
                          width={28}
                          onClick={() => pauseUpload(item.uid)}
                        />
                      )}
                      {item.status != uploadStatus.init.value &&
                        item.status != uploadStatus.upload_finish.value &&
                        item.status != uploadStatus.upload_seconds.value && (
                          <Icon
                            className="del btn-item"
                            iconName="del"
                            title="删除"
                            width={28}
                            onClick={() => delUpload(item.uid, index)}
                          />
                        )
                      }
                      {item.status == uploadStatus.upload_finish.value &&
                        item.status == uploadStatus.upload_seconds.value && (
                          <Icon
                            className="clean btn-item"
                            iconName="clean"
                            title="清除"
                            width={28}
                            onClick={() => delUpload(item.uid, index)}
                          />
                        )
                      }
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {fileList.length === 0 && (<NoData msg="暂无上传任务" />)}
      </div>
    </div>
  );
});

export default Uploader;
