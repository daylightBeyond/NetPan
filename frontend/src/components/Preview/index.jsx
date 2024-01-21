import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import useMergeState from "../../hooks/useMergeState";
import PreviewImage from "./PreviewImage.jsx";
import PreviewVideo from "./PreviewVideo.jsx";
import Window from "../Window/Window.jsx";
import { getImage } from "../../servers/home";
import * as homeRequest from '../../servers/home';
import * as adminRequest from '../../servers/admin';
import * as shareRequest from '../../servers/share';
const FILE_URL_MAP = {
  0: {
    fileUrl: homeRequest.getFileUrl,
    videoUrl: homeRequest.getVideoUrl,
    createDownLoadUrl: homeRequest.createDownLoadUrl,
    downloadUrl: homeRequest.downloadFile,
  },
  1: {
    fileUrl: adminRequest.getFileUrl,
    videoUrl: adminRequest.getVideoUrl,
    createDownLoadUrl: adminRequest.createDownLoadUrl,
    downloadUrl: adminRequest.downloadFile,
  },
  2: {
    fileUrl: shareRequest.getFileUrl,
    videoUrl: shareRequest.getVideoUrl,
    createDownLoadUrl: shareRequest.createDownLoadUrl,
    downloadUrl: shareRequest.downloadFile,
  },
}

/**
 * 预览组件
 *
 * @returns {JSX.Element}
 * @constructor
 */
const Preview = forwardRef((props, ref) => {

  const [state, setState] = useMergeState({
    fileInfo: {}, // 预览的文件信息
    imageUrl: [],

    windowShow: false,
    url: null,
  });

  const {
    fileInfo, imageUrl,
    windowShow, url
  } = state;

  const imageViewRef = useRef(null);

  useEffect(() => {
    if (fileInfo.filePath) {
      getImage(fileInfo.filePath).then(res => {
        console.log('预览图片', res);
        // 将后端返回的二进制流图片转换成blob
        const blob = new Blob([res]);
        setState({ imageUrl: URL.createObjectURL(blob) });
      })
    }
  }, [fileInfo]);

  useImperativeHandle(ref, () => {
    return {
      showPreview
    }
  });

  /**
   * 展示预览的类型
   * @param data
   * @param type 0: file，1：admin，2：share
   */
  const showPreview = (data, type) => {
    setState({ fileInfo: data });
    // 文件分类 1:视频 2:音频 3:图片 4:文档 5:其他
    if (data.fileCategory == 3) { // 图片
      console.log('imageViewRef', imageViewRef);
      imageViewRef.current?.show(0);
    } else {
      setState({ windowShow: true });
      let _url = FILE_URL_MAP[type].fileUrl;

      if (data.fileCategory == 1) {
        _url = FILE_URL_MAP[type].videoUrl
      }

      if (type == 0) {

      }
    }
  };

  const closeWindow = () => {
    setState({ windowShow: false });
  };

  return (
    <>
      {/* fileCategory,文件分类 1:视频 2:音频 3:图片 4:文档 5:其他 */}
      {fileInfo.fileCategory == 3 ? (
        <PreviewImage ref={imageViewRef} imageList={imageUrl} />
      ): (
        <Window
          show={windowShow}
          width={fileInfo.fileCategory == 1 ? 1500 : 900}
          close={closeWindow}
          title={fileInfo.fileName}
          align={fileInfo.fileCategory == 1 ? 'center' : 'top'}
        >
          {fileInfo.fileCategory == 1 && (
            <PreviewVideo url={url} />
          )}
        </Window>
      )}
    </>
  );
});

// Preview.defaultProps = {
//   imageList: [],
// }

export default Preview;
