import { create } from 'zustand';
import SparkMd5 from 'spark-md5';
import uploadStatus from "@/constants/upload-status.js";
import { uploadFile } from '../servers/home';
/*
 * 这里的一些操作原本都是在 Uploader 组件中的操作，
 * 只是由于组件通信不方便，通过状态管理的方法来解决
 */
const useUploadFileStore = create((set, get) => ({
  // 控制上传区域是否显示
  showUploader: false,
  // 上传的文件列表
  fileList: [],
  // 删除的文件列表
  delList: [],
  // 文件切片的大小
  chunkSize: 1 * 1024 * 1024, // 5MB
  setShowUploader: (data) => {
    console.log('切换', data);
    set({ showUploader: data });
  },
  test: () => {
    return 1111;
  },
  // 添加文件信息
  addFile: async (fileData) => {
    console.log('fileData', fileData);
    const { file, filePid } = fileData;

    const { sliceChunk, fileList, computedMd5, getFileByUid, uploadFile } = useUploadFileStore.getState();

    const fileItem = {
      // 文件，文件大小，文件流，文件名
      file: file,
      // 文件 UID
      uid: file.uid,
      // md5进度
      md5Progress: 0,
      // md5 值
      md5: null,
      // 文件名
      fileName: file.name,
      // 上传状态
      status: uploadStatus.init.value,
      // 已上传大小
      uploadSize: 0,
      // 文件总大小
      totalSize: file.size,
      // 上传进度
      uploadProgress: 0,
      // 暂停
      pause: false,
      // 当前分片
      chunkIndex: 0,
      // 文件父级ID
      filePid: filePid,
      // 错误信息
      errorMsg: null
    };
    set({ fileList: [fileItem, ...fileList] });
    if (fileItem.totalSize == 0) {
      fileItem.status = uploadStatus.emptyFile.value;
      return;
    }
    let md5FileUid = await computedMd5(fileItem);
    if (md5FileUid == null) {
      return;
    }
    console.log(getFileByUid(md5FileUid).md5);
    uploadFile(md5FileUid);
  },
  // 文件切片
  sliceChunk: (file, chunkSize) => {
    const fileSize = file.size;
    let start = 0;
    while (start < fileSize) {

    }
  },
  getFileByUid: (uid) => {
    const { fileList } = useUploadFileStore.getState();
    const file = fileList.find(item => item.file.uid === uid);
    return file;
  },
  // 计算文件md5值
  computedMd5: (fileItem) => {
    const { chunkSize, getFileByUid, test } = useUploadFileStore.getState();
    const file = fileItem.file;
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0; // 当前分片
    let spark = new SparkMd5.ArrayBuffer();
    let fileReader = new FileReader();
    // 切片
    const loadNext = () => {
      let start = currentChunk * chunkSize;
      let end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    };
    loadNext();

    return new Promise( async(resolve, reject) => {
      let resultFile = getFileByUid(file.uid)
      console.log('resultFile', resultFile);
      fileReader.onload = (e) => {
        spark.append(e.target.result);
        currentChunk++;
        if (currentChunk < chunks) {
          console.log(`${file.name}, ${currentChunk}分片解析完成，开始第${currentChunk + 1}`);
          let percent = Math.floor((currentChunk / chunks) * 100);
          resultFile.md5Progress = percent;
          console.log('percent', percent);
          loadNext();
        } else {
          let md5 = spark.end();
          spark.destroy();
          resultFile.md5Progress = 100;
          resultFile.status = uploadStatus.uploading.value;
          resultFile.md5 = md5;
          resolve(fileItem.uid);
        }
      };

      fileReader.onerror = () => {
        resultFile.md5Progress = -1;
        resultFile.status = uploadStatus.fail.value;
        resolve(fileItem.uid);
      };
    }).catch(error => {
      console.log(error);
      return null;
    })
  },
  // 上传文件
  uploadFile: async (uid, chunkIndex) => {
    chunkIndex = chunkIndex ? chunkIndex : 0;
    const { getFileByUid, chunkSize, delList } = useUploadFileStore.getState();
    // 分片上传
    let currentFile = getFileByUid(uid);
    console.log('currentFile', currentFile);
    const file = currentFile.file;
    const fileSize = currentFile.totalSize;
    const chunks = Math.ceil(fileSize / chunkSize);
    console.log('chunks', chunks);
    try {
      for (let i = chunkIndex; i < chunks; i++) {
        console.log(`上传第${i}片分片`);
        let delIndex = delList.indexOf((uid));
        if (delIndex != -1) {
          set({ delList: delList.splice(delIndex, 1) })
          break;
        }
        currentFile = getFileByUid(uid);
        if (currentFile.pause) {
          break;
        }
        let start = i * chunkSize;
        let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize;
        let chunkFile = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunkFile);
        formData.append('fileName', file.name);
        formData.append('fileMd5', currentFile.md5);
        formData.append('chunkIndex', i);
        formData.append('chunks', chunks);
        formData.append('fileId', currentFile.fileId);
        formData.append('filePid', currentFile.filePid);

        console.log('params', formData);
        const updateResult = await uploadFile(formData);
        console.log('updateResult', updateResult);
        if(updateResult == null) {
          break;
        }
        currentFile.fileId = updateResult.data.fileId;
        currentFile.status = uploadStatus[updateResult.data.status].value;
        currentFile.chunkIndex = i;
        if (updateResult.data.status == uploadStatus.upload_seconds.value || updateResult.data.status == uploadStatus.upload_finish.value) {
          currentFile.uploadProgress = 100;
          // 上传完文件的回调 => TODO 更新用户的使用空间
          // uploadCallback
          break;
        }
      }
    } catch (e) {
      console.error('文件上传异常', e);
    }
  },
}));

export default useUploadFileStore;
