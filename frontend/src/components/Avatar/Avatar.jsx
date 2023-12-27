import React, { useEffect, forwardRef } from 'react';
import { Avatar as AvatarImg } from 'antd';
import useHomeStore from '@/store/homeStore.js';

const Avatar = (props) => {
  // zustand 不建议这种写法，容易造成重复渲染
  // const { imgUrl, getUserAvatar } = useHomeStore(state => state);
  // 建议写法
  const imgUrl = useHomeStore(state => state.imgUrl);
  const getUserAvatar = useHomeStore(state => state.getUserAvatar);

  useEffect(() => {
    getUserAvatar({ userId: props.userId });
  }, []);
  return (
    <AvatarImg src={imgUrl} size="large" />
  );
};

export default Avatar;
