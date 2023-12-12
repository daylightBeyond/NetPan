import React, { useEffect } from 'react';
import menus from '../../constants/router-constants.js';
import useMergeState from "@/hooks/useMergeState";
import 'style.less';

const Menu = () => {
  const [state, setState] = useMergeState({
    currentMenu: {}, // 当前动态路由菜单
    currentPath: {}, // 当前路径
    showUploader: false, // 控制上传区域是否显示
  });

  const { currentMenu, currentPath, showUploader } = state;

  useEffect(() => {
    console.log('location', location)
    if (location.state && location.state.menuCode) {
      setMenu(location.state.menuCode, location.pathname);
    }
  }, [location]);

  const jump = (data) => {
    console.log('jump--data', data);
    console.log('jump--currentMenu', currentMenu);
    debugger
    if(!data.path || data.menuCode == currentMenu.menuCode) {
      return;
    }
    navigate(data.path, {
      state: {
        needLogin: true,
        menuCode: "main",
      },
    });
  };

  const setMenu = (menuCode, path) => {
    console.log('setMenu--menuCode', menuCode);
    console.log('setMenu--path', path);
    const menu = menus.find(item => {
      return item.menuCode === menuCode;
    });
    console.log('menu', menu);
    setState({
      currentMenu: menu,
      currentPath: path
    });
  };

  return (
    // <nav>
      <div className="left-sider">
        <div className="menu-list">
          {menus.map(item =>
            <div
              className={`menu-item ${item.menuCode == currentMenu.menuCode ? 'active' : ''}`}
              key={item.menuCode}
              onClick={() => jump(item)}
            >
              <div className={`iconfont ${'icon-' + item.icon}`}></div>
              <div className="text">{item.name}</div>
            </div>
          )}
        </div>
        <div className="menu-sub-list">
          {currentMenu.children?.map(sub =>
            // <NavLink
            //   className={`menu-item-sub ${currentPath == sub.path ? 'active' : ''}`}
            //   key={sub.path}
            //   to={sub.data?.path}
            // >
            //   {sub.icon && (
            //     <span className={`iconfont ${'icon-' + sub.icon}`}></span>
            //   )}
            //   {sub.name}
            // </NavLink>
            <div key={sub.path}>
              <div
                className={`menu-item-sub ${currentPath == sub.path ? 'active' : ''}`}
                onClick={() => jump(sub)}
              >
                {sub.icon && (
                  <span className={`iconfont ${'icon-' + sub.icon}`}></span>
                )}
                <div className="text">{sub.name}</div>
              </div>
            </div>
          )}
          {currentMenu?.tips && (
            <div className="tips">{currentMenu.tips}</div>
          )}
          <div className="space-info">
            <div>空间使用</div>
            <div className="percent"></div>
          </div>
        </div>
      </div>
    // </nav>
  );
};

export default Menu;