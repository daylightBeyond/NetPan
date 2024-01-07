import React, { memo, useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button, Popover, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import useMergeState from "@/hooks/useMergeState";
import useHomeStore from '@/store/homeStore.js';
import useUploadFileStore from "@/store/uploadFileStore";
import { menus } from '@/constants/router-constants.js';
import Avatar from '../../components/Avatar/Avatar.jsx';
import UpdateAvatar from "./UpdateAvatar.jsx";
import UpdatePassword from "./UpdatePassword.jsx";
import Uploader from "./Uploader.jsx";
// import './style.less';

const FrameWork = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  const [state, setState] = useMergeState({
    currentMenu: {}, // 当前动态路由菜单
    currentPath: '/home/all', // 当前路径
    // showUploader: false, // 控制上传区域是否显示
    avatarVisible: false, // 控制更新头像弹窗
    passwordVisible: false, // 控制更新密码弹窗
  });

  const { currentMenu, currentPath, avatarVisible, passwordVisible } = state;
  // useHomeStore
  const getUserAvatar = useHomeStore(state => state.getUserAvatar);

  // useUploadFileStore
  const showUploader = useUploadFileStore(state => state.showUploader);
  const setShowUploader = useUploadFileStore(state => state.setShowUploader);
  useEffect(() => {
    console.log('location', location)

    if (location.state && location.state.menuCode) {
      setMenu(location.state.menuCode, location.pathname);
    }
  }, [location]);

  const jump = (data) => {
    // console.log('jump--data', data);
    // console.log('jump--currentMenu', currentMenu);
    if (!data.path || data.menuCode == currentMenu.menuCode) {
      return;
    }
    // navigate(data.path);
    navigate(data.path, {
      replace: true,
      state: {
        needLogin: true,
        menuCode: data.menuCode || currentMenu.menuCode,
      },
    });
  };

  const setMenu = (menuCode, path) => {
    // console.log('setMenu--menuCode', menuCode);
    // console.log('setMenu--path', path);
    const menu = menus.find(item => {
      return item.menuCode === menuCode;
    });
    // console.log('menu', menu);
    setState({
      currentMenu: menu,
      currentPath: path
    });
  };

  const reloadAvatar = () => {
    getUserAvatar({ userId: userInfo.userId });
  };

  const dropdownItem = [
    { key: '1', label: '修改头像' },
    { key: '2', label: '修改密码' },
    { key: '3', label: '退出' },
  ];

  const updateAvatar = () => {
    setState({ avatarVisible: true });
  };

  const updatePassword = () => {
    setState({ passwordVisible: true });
  };

  const exit = () => {
    console.log('333')

  }

  const funcMap = {
    '1': updateAvatar,
    '2': updatePassword,
    '3': exit,
  }

  const handleDropDown = (val) => {
    console.log('val', val);
    funcMap[val.key]()
  };

  const changeState = (state) => {
    setState(state);
  };

  return (
    <div className="framework">
      {/* 头部 */}
      <div className="header">
        <div className="logo">
          <span className="iconfont icon-pan"></span>
          <div className="name">Net云盘</div>
        </div>
        <div className="right-panel">
          <Popover
            open={showUploader}
            trigger="click"
            placement="bottom"
            onClick={() => {
              setShowUploader(!showUploader)
            }}
            content={<Uploader />}
            overlayStyle={{ marginTop: '25px', padding: 0, width: '800px' }}
          >
            <span className="iconfont icon-transfer"></span>
          </Popover>

          <Dropdown
            menu={{ items: dropdownItem, onClick: handleDropDown }}
            placement="bottom"
          >
            <div className='user-info'>
              <div className="avatar">
                  <Avatar userId={userInfo.userId}/>
                {/*touxiang*/}
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
          <Outlet/>
        </div>
      </div>

      {avatarVisible && (
        <UpdateAvatar
          open={avatarVisible}
          changeState={(state) => changeState(state)}
          updateAvatar={reloadAvatar}
        />
      )}
      {passwordVisible && (
        <UpdatePassword
          open={passwordVisible}
          changeState={(state) => changeState(state)}
          userId={userInfo.userId}
        />
      )}
    </div>
  );
};

export default memo(FrameWork);
