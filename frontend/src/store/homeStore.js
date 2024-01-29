import { create } from 'zustand';
import { getAvatar } from '../servers/common.js';
import { getUseSpace } from '../servers/home';

const useHomeStore = create((set, get) => ({
  // 头像的url
  imgUrl: '',
  // 用户空间信息
  userSpaceInfo: {
    // 用户总空间
    totalSpace: 1,
    // 已使用空间
    useSpace: 0,
  },
  // 获取用户头像
  getUserAvatar: (payload) => {
    getAvatar(payload).then(res => {
      // 将后端返回的二进制流图片转换成blob
      const blob = new Blob([res]);
      set({ imgUrl: URL.createObjectURL(blob) });
    })
  },
  // 获取用户使用空间
  getUserSpace: () => {
    getUseSpace().then(res => {
      if (res.success) {
        set({
          userSpaceInfo: {...res.data}
        });
      }
    })
  }
}));

export default useHomeStore;
