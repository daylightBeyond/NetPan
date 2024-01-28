import React from 'react';
import { Button } from "antd";
import Icon from "../Icon/Icon.jsx";
import { sizeToStr, downloadByUrl  } from "../../utils/utils";
import request from "../../utils/request";
import './previewStyle.less';
const PreviewDownload = ({
  createDownloadUrl, downloadUrl, fileInfo
}) => {

  const download = async () => {
    const res = await request({
      method: 'get',
      url: createDownloadUrl,
    });
    if (res?.success) {
      const url = downloadUrl + res.data;
      downloadByUrl(url, fileInfo.fileName);
    }
  };

  return (
    <div className="others">
      <div className="body-content">
        <Icon
          iconName={fileInfo.fileType == 9 ? 'zip' : 'others'}
          width={100}
        />
        <div className="file-name">{fileInfo.fileName}</div>
        <div className="tips">该类型的文件暂不支持预览，请下载后查看</div>
        <div className="download-btn">
          <Button type="primary" onClick={download}>
            点击下载{sizeToStr(fileInfo.fileSize)}
          </Button>
        </div>
      </div>
    </div>
  );
};

PreviewDownload.defaultProps = {
  createDownloadUrl: '',
  downloadUrl: '',
  fileInfo: {}
};

export default PreviewDownload;
