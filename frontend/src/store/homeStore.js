import { create } from 'zustand';
import { getAvatar } from '../servers/common.js';

const useHomeStore = create((set, get) => ({
  // 头像的url
  imgUrl: '',
  // 控制上传区域是否显示
  showUploader: false,
  // 已上传的文件列表
  fileList: [],
  // 添加的临时文件
  fileData: {},
  // 获取用户头像
  getUserAvatar: (payload) => {
    getAvatar(payload).then(res => {
      console.log('获取用户头像', res);
      // 将后端返回的二进制流图片转换成blob
      const blob = new Blob([res]);
      set({ imgUrl: URL.createObjectURL(blob) });
    })
  },
  setShowUploader: (data) => {
    console.log('切换', data);
    set({ showUploader: data });
  },
  // 上传文件
  setFileData: (fileData) => {
    console.log('上传文件',fileData);
    set({ fileData, showUploader: true});
  },
}));

export default useHomeStore;
