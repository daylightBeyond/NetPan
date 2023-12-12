import React, { useEffect, useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button, Popover, Dropdown, Avatar } from 'antd';
import { useNavigate, useLocation, useH } from 'react-router-dom';
import useMergeState from "@/hooks/useMergeState";
import menus from '../../constants/router-constants.js';
import './style.less';

const FrameWork = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || {});

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
    if(!data.path || data.menuCode == currentMenu.menuCode) {
      return;
    }
    console.log('asasd')
    // navigate(data.path);
    navigate(data.path, {
      state: {
        needLogin: true,
        menuCode: data.menuCode || currentMenu.menuCode,
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

  const dropdownItem = [
    { key: '1', label: '修改头像' },
    { key: '2', label: '修改密码' },
    { key: '3', label: '退出' },
  ];

  const updateAvatar = () => {
    console.log('111')
  };

  const updatePassword = () => {
    console.log('222')

  };

  const exit = () => {
    console.log('333')

  }

  const handleDropDown = (val) => {
    console.log('val', val);
  }

  return (
    <div className="framework">
      {/* 头部 */}
      <div className="header">
        <div className="logo">
          <span className="iconfont icon-pan"></span>
          <div className="name">Net云盘</div>
        </div>
        <div className="right-panel">
          <Popover>
            <span className="iconfont icon-transfer"></span>
            {/*<Uploader ref="uploaderRef" @uploadCallback="uploadCallbackHandler"/>*/}
          </Popover>

          <Dropdown
            menu={{ items: dropdownItem, onClick: handleDropDown }}
          >
            <div className='user-info'>
              <div className="avatar">
                <Avatar />
              </div>
              <div className="nick-name">{userInfo.username}</div>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="body">
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
        <div className="body-content">
          <Outlet></Outlet>
        </div>
      </div>
    </div>
  );
}

export default FrameWork;