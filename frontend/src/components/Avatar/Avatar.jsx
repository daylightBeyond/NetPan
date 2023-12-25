import React, { useEffect, forwardRef } from 'react';
import { Avatar as AvatarImg } from 'antd';
import useMainStore from '@/store/mainStore.js';

const Avatar = (props) => {
  // zustand 不建议这种写法，容易造成重复渲染
  // const { imgUrl, getUserAvatar } = useMainStore(state => state);
  // 建议写法
  const imgUrl = useMainStore(state => state.imgUrl);
  const getUserAvatar = useMainStore(state => state.getUserAvatar);

  useEffect(() => {
    getUserAvatar({ userId: props.userId });
  }, []);
  return (
    <AvatarImg src={imgUrl} size="large" />
  );
};

export default Avatar;