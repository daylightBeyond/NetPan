import { create } from 'zustand';
import uploadStatus from "@/constants/upload-status.js";

const useUploadFileStore = create((set, get) => ({
  // 控制上传区域是否显示
  showUploader: false,
  // 上传的文件列表
  fileList: [],
  setShowUploader: (data) => {
    console.log('切换', data);
    set({ showUploader: data });
  },
  // 添加文件信息
  addFile: (fileData) => {
    console.log('fileData', fileData);
    const { file, filePid } = fileData;
  },
  // 文件切片
  spliceChunk: (fileItem) => {

  },
  // 计算md5值
  computedMd5: (fileItem) => {

  },
  // 上传文件
  uploadFile: (fileItem) => {

  }
}));

export default useUploadFileStore;
