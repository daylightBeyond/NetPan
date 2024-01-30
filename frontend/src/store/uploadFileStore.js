import { create } from 'zustand';
import SparkMd5 from 'spark-md5';
import uploadStatus from "@/constants/upload-status.js";
import useHomeStore from "./homeStore";
import { uploadFile as upload } from '../servers/home';

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
  chunkSize: 4 * 1024 * 1024, // 4MB
  // 上传文件之后引发查询文件列表的变量
  queryFileFlag: false,
  // 上传的文件总大小
  fileTotalSize: 0,
  setQueryFileFlag: (data) => {
    set({ queryFileFlag: data });
  },
  setShowUploader: (data) => {
    set({ showUploader: data });
  },
  setFileTotalSize: (data) => {
    set({ fileTotalSize: data });
  },
  updateFileState: async (payload = {}) => {
    const {
      progress, status, md5, fileId, chunkIndex, uploadSize,
      uploadProgress, errMsg, file
    } = payload;

    await set(state => {
      const updatedFileList = state.fileList.map(item =>
        item.uid === file.uid
          ?  {
            ...item,
            md5Progress: progress,
            status: status || item.status,
            md5: md5 || item.md5,
            fileId: fileId || item.fileId,
            chunkIndex: chunkIndex || item.chunkIndex,
            uploadSize: uploadSize || item.uploadSize,
            uploadProgress: uploadProgress || item.uploadProgress,
            errMsg: errMsg || item.errMsg
          }
          : item
      );
      return { ...state, fileList: updatedFileList };
    });
  },
  // 添加文件信息
  addFile: async (fileData) => {
    console.log('fileData', fileData);
    const { file, filePid } = fileData;

    const { fileList, computedMd5, getFileByUid, uploadFile } = useUploadFileStore.getState();

    // 每次开发时都需要将 是否查询文件列表的参数置为 false，防止重复查询
    set({  queryFileFlag: false });

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

    // 更新页面上传状态
    // const updateFileState = async ({
    //   progress, status, md5, fileId, chunkIndex, uploadSize,
    //   uploadProgress, errMsg,
    // }) => {
    //    await set(state => {
    //     const updatedFileList = state.fileList.map(item =>
    //       item.uid === file.uid
    //       ?  {
    //           ...item,
    //           md5Progress: progress,
    //           status: status || item.status,
    //           md5: md5 || item.md5,
    //           fileId: fileId || item.fileId,
    //           chunkIndex: chunkIndex || item.chunkIndex,
    //           uploadSize: uploadSize || item.uploadSize,
    //           uploadProgress: uploadProgress || item.uploadProgress,
    //           errMsg: errMsg || item.errMsg
    //         }
    //       : item
    //     );
    //     return { ...state, fileList: updatedFileList };
    //   });
    // };

    let md5FileUid = await computedMd5(fileItem);
    if (md5FileUid == null) {
      return;
    }
    console.log(getFileByUid(md5FileUid).md5);
    await uploadFile(md5FileUid);
  },
  /**
   * 根据uid获取文件，为什么不通过file传参的形式，
   * 因为上传是异步并且文件列表是多个，无法准确的传递file，只能通过uid获取
   * @param uid 文件uid
   * @returns {*} file
   */
  getFileByUid: (uid) => {
    const { fileList } = useUploadFileStore.getState();
    const file = fileList.find(item => item.file.uid === uid);
    return file;
  },
  // 计算文件md5值
  computedMd5: (fileItem) => {
    const { chunkSize, getFileByUid, updateFileState } = useUploadFileStore.getState();
    const file = fileItem.file;
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
    const chunks = Math.ceil(file.size / chunkSize); // 计算总共可以切成多少片
    let currentChunk = 0; // 当前分片
    const spark = new SparkMd5.ArrayBuffer();
    const fileReader = new FileReader();
    // 切片
    // 使用外部传递的 updateFileState 来更新进度
    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    };
    loadNext();

    return new Promise(async(resolve, reject) => {
      let resultFile = getFileByUid(file.uid)
      console.log('resultFile', resultFile);

      // fileReader.onload onerror 是异步的
      // 文件加载完成
      fileReader.onload = (e) => {
        spark.append(e.target.result);
        currentChunk++;
        if (currentChunk < chunks) {
          console.log(`${file.name}, ${currentChunk}分片解析完成，开始第${currentChunk + 1}, 一共有${chunks}片`);
          const percent = Math.floor((currentChunk / chunks) * 100);
          // 使用外部传递的 updateFileState 来更新进度
          updateFileState({ progress: percent, file: resultFile });
          console.log('percent', percent);
          loadNext();
        } else {
          const md5 = spark.end();
          spark.destroy();
          const updateStatus = {
            file: resultFile,
            progress: 100,
            status: uploadStatus.uploading.value,
            md5
          };
          updateFileState(updateStatus);
          resolve(fileItem.uid);
        }
      };
      // 文件读取错误
      fileReader.onerror = () => {
        const updateStatus = {
          file: resultFile,
          progress: -1,
          status: uploadStatus.fail.value
        };
        updateFileState(updateStatus);
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
    const { getFileByUid, chunkSize, delList, fileTotalSize, updateFileState } = useUploadFileStore.getState();
    // 分片上传
    let currentFile = getFileByUid(uid);
    console.log('currentFile', currentFile);
    const file = currentFile.file;
    const fileSize = currentFile.totalSize;
    const chunks = Math.ceil(fileSize / chunkSize);
    console.log('chunks', chunks);
    try {
      for (let i = chunkIndex; i <= chunks; i++) {
        console.log(`上传第${i}片分片`);
        let delIndex = delList.indexOf((uid));
        if (delIndex != -1) {
          set({ delList: delList.splice(delIndex, 1) })
          break;
        }
        // 因为状态可能会变，需要每次都拿一次
        currentFile = getFileByUid(uid);
        if (!currentFile || currentFile.pause) {
          // 记录暂停文件的索引
          sessionStorage.setItem(uid, i);
          break;
        }
        let start = i * chunkSize;
        let end = start + chunkSize >= fileSize ? fileSize : start + chunkSize;
        const chunkFile = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunkFile);
        formData.append('fileName', file.name);
        formData.append('fileMd5', currentFile.md5);
        formData.append('chunkIndex', i);
        formData.append('chunks', chunks);
        // fileId是后端生成，第一片是没有fileId的
        // 第一片上传成功，后端会返回fileId，直接带进来
        formData.append('fileId', currentFile.fileId);
        formData.append('filePid', currentFile.filePid);
        formData.append('fileTotalSize', fileTotalSize);

        console.log('params', formData);
        // 错误的回调
        const errorCallback = async (errorMsg) => {
          const updateStatus = {
            file: currentFile,
            status: uploadStatus.fail.value,
            errorMsg: errorMsg,
          };
          await updateFileState(updateStatus);
        };
        // 上传进度回调
        const uploadProgressCallback = async (event) => {
          console.log('上传接口回调event', event);
          let loaded = event.loaded;
          console.log('上传loaded', loaded);
          if (loaded > fileSize) {
            loaded = fileSize;
          }
          const updateStatus = {
            file: currentFile,
            uploadSize: i * chunkSize + loaded,
            uploadProgress: Math.floor((currentFile.uploadSize / fileSize) * 100)
          };
          await updateFileState(updateStatus);
        };
        const updateResult = await upload(formData, { errorCallback, uploadProgressCallback });
        console.log('updateResult', updateResult);
        if(updateResult == null) {
          break;
        }
        const updateStatus = {
          file: currentFile,
          fileId: updateResult.data.fileId,
          status: uploadStatus[updateResult.data.status].value,
          chunkIndex: i,
        };
        await updateFileState(updateStatus);
        if (
          updateResult.data.status == uploadStatus.upload_seconds.value ||
          updateResult.data.status == uploadStatus.upload_finish.value
        ) {
          console.log('最后上传完的文件情况', updateResult);
          const lastFileChunkUpdate = {
            file: currentFile,
            uploadProgress: 100,
          }
          console.log('需要更新的信息', lastFileChunkUpdate);
          await updateFileState(lastFileChunkUpdate);
          const { uploadCallback, fileList } = useUploadFileStore.getState();
          console.log('上传完之后的currentFile', currentFile);
          console.log('上传完之后的fileList', fileList);
          // 上传完文件之后，清除uid对应的索引
          sessionStorage.removeItem(uid);
          // set({ fileList: [...fileList] });
          // 需要在上传完文件之后重新查询下文件，并且更新用户使用空间
          // 上传完文件的回调
          uploadCallback();
          break;
        }
      }
    } catch (e) {
      console.error('文件上传异常', e);
    }
  },
  // 需要在上传完文件之后重新查询下文件，并且更新用户使用空间
  uploadCallback: () => {
    // 触发查询文件列表
    set({ queryFileFlag: true });
    // 查询用户使用空间
    const { getUserSpace } = useHomeStore.getState();
    getUserSpace();
  },
  // 删除文件列表
  deleteFile: (uid) => {
    const { fileList } = useUploadFileStore.getState();
    const index = fileList.findIndex(item => item.uid === uid);
    fileList.splice(index, 1);
    set({ fileList: [...fileList] });
  },
  pauseUploadFile: (uid) => {
    const { fileList } = useUploadFileStore.getState();
    const index = fileList.findIndex(item => item.uid === uid);
    fileList[index].pause = true;
    fileList[index].status = uploadStatus.pause.value;
    set({ fileList: [...fileList] });
  },
  startUploadFile: async (uid) => {
    const { fileList, uploadFile } = useUploadFileStore.getState();
    const index = fileList.findIndex(item => item.uid === uid);
    fileList[index].pause = false;
    fileList[index].status = uploadStatus.uploading.value;
    set({ fileList: [...fileList] });
    const chunkIndex = sessionStorage.getItem(uid);
    await uploadFile(uid, chunkIndex);
  },
}));

export default useUploadFileStore;
