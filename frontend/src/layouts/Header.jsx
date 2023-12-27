import React from 'react';
import { Dropdown, Popover } from "antd";
import Uploader from "../pages/FrameWork/Uploader.jsx";
import useMergeState from "@/hooks/useMergeState";
import useHomeStore from '@/store/homeStore.js';
const Header = () => {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};
  const [state, setState] = useMergeState({
    currentMenu: {}, // 当前动态路由菜单
    currentPath: {}, // 当前路径
    showUploader: false, // 控制上传区域是否显示
    avatarVisible: false, // 控制更新头像弹窗
    passwordVisible: false, // 控制更新密码弹窗
  });

  const { currentMenu, currentPath, showUploader, avatarVisible, passwordVisible } = state;
  const getUserAvatar = useHomeStore(state => state.getUserAvatar);

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

  return (
    <div className="header">
      <div className="logo">
        <span className="iconfont icon-pan"></span>
        <div className="name">Net云盘</div>
      </div>
      <div className="right-panel">
        <Popover
          // open={showUploader}
          trigger="click"
          // onOpenChange={}
          placement="bottom"
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
              {/* <Avatar userId={userInfo.userId}/> */}
              touxiang
            </div>
            <div className="nick-name">{userInfo.username}</div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Header;
