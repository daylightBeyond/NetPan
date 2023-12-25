import { create } from 'zustand';
import { getAvatar } from '../servers/common.js';

const useMainStore = create((set, get) => ({
  // 头像的url
  imgUrl: '',
  // 获取用户头像
  getUserAvatar: (payload) => {
    getAvatar(payload).then(res => {
      console.log('获取用户头像', res);
      // 将后端返回的二进制流图片转换成blob
      const blob = new Blob([res]);
      set({ imgUrl: URL.createObjectURL(blob) });
    })
  },
}));

export default useMainStore;