import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import useMergeState from "../../hooks/useMergeState";
import PreviewImage from "./PreviewImage.jsx";
import PreviewVideo from "./PreviewVideo.jsx";
import PreviewPdf from "./PreviewPdf.jsx";
import PreviewDoc from "./PreviewDoc.jsx";
import PreviewExcel from "./PreviewExcel.jsx";
import PreviewTxt from "./PreviewTxt.jsx";
import PreviewMusic from "./PreviewMusic.jsx";
import Window from "../Window/Window.jsx";
import { getImage } from "../../servers/home";

const FILE_URL_MAP = {
  0: {
    fileUrl: '/file/getFile/',
    videoUrl: '/file/ts/getVideoInfo/',
    createDownloadUrl: '/file/createDownLoadUrl/',
    downloadUrl: '/file/download/',
  },
  1: {
    fileUrl: '/admin/getFile/',
    videoUrl: '/admin/ts/getVideoInfo/',
    createDownloadUrl: '/admin/createDownLoadUrl/',
    downloadUrl: '/admin/download/',
  },
  2: {
    fileUrl: '/share/getFile/',
    videoUrl: '/share/ts/getVideoInfo/',
    createDownloadUrl: '/share/createDownLoadUrl/',
    downloadUrl: '/share/download/',
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

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

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
      getImage(data.filePath).then(res => {
        console.log('预览图片', res);
        // 将后端返回的二进制流图片转换成blob
        const blob = new Blob([res]);
        setState({ imageUrl: URL.createObjectURL(blob) });
      })
      imageViewRef.current?.show(0);
    } else {
      setState({ windowShow: true });
      let _url = FILE_URL_MAP[type].fileUrl;

      if (data.fileCategory == 1) {
        _url = FILE_URL_MAP[type].videoUrl
      }

      if (type == 0) {
        _url = _url + userInfo.userId + '/' + data.fileId
      }

      setState({ url: _url  });
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

          {/* fileType 1:视频 2:音频 3:图片 4:pdf 5:doc 6:excel 7:txt 8:code 9:zip 10:其他 */}
          {/* PreviewPdf */}

          {fileInfo.fileType == 4 && (
            <PreviewPdf filePath={fileInfo.filePath} />
          )}

          {fileInfo.fileType == 5 && (
            <PreviewDoc url={url} />
          )}

          {fileInfo.fileType == 6 && (
            <PreviewExcel url={url} />
          )}

          {(fileInfo.fileType == 7 || fileInfo.fileType == 8) && (
            <PreviewTxt url={url} fileName={fileInfo.fileName} />
          )}

          {fileInfo.fileCategory == 2 && (
            <PreviewMusic url={url} fileName={fileInfo.fileName} />
          )}
        </Window>
      )}
    </>
  );
});

export default Preview;
