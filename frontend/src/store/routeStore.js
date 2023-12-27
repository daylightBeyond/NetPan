import { create } from 'zustand';

const useRouteStore = create((set, get) => ({
  // 二级路由的code
  menuItem: 'main',
  // 设置二级路由的code
  setMenuItem: (menu) => {
    set({ menuItem: menu });
  },
}));

export default useRouteStore;
