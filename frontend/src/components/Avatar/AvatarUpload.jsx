import React, { useEffect, useState } from 'react';
import { Upload, Button, message } from 'antd';
import useMergeState from "../../hooks/useMergeState";
import { getAvatar } from '../../servers/common';
import './style.less';
const AvatarUpload = ({ userId, setFormData }) => {
  const [state, setState] = useMergeState({
    imgUrl: '',
    localFile: null,
  });
  const { imgUrl, localFile } = state;

  useEffect(() => {
    getUserAvatar();
  }, []);

  // 获取用户头像
  const getUserAvatar = () => {
    getAvatar({ userId }).then(res => {
      console.log('获取用户头像', res);
      // 将后端返回的二进制流图片转换成blob
      const blob = new Blob([res]);
      setState({ imgUrl: URL.createObjectURL(blob) });
    });
  };

  // 上传文件之前的钩子
  const beforeUpload = (file) => {
    console.log('file', file);
    const limit5M = file.size / 1024 / 1024;
    if (limit5M > 5) {
      message.warning('图片必须小于 5MB!');
      return false;
    }
    return true;
  };

  // 自定义上传文件行为
  const customRequest = (options) => {
    console.log('options', options);
    const { file, onSuccess, onError } = options;
    let img = new FileReader();
    img.readAsDataURL(file);
    img.onload = ({ target }) => {
      console.log('target', target);
      setState({ localFile: target.result });
    };
    setFormData({ avatar: file });
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-show">
        <img src={localFile ? localFile : imgUrl} alt="头像" />
        {/*{localFile ? (*/}
        {/*  <img src={localFile} alt="头像"/>*/}
        {/*) : (*/}
        {/*  <img src={imgUrl} alt="头像"/>*/}
        {/*)}*/}
      </div>

      <div className="select-btn">
        <Upload
          name="avatar"
          showUploadList={false}
          accept="image/*"
          multiple={false}
          beforeUpload={beforeUpload}
          customRequest={customRequest}
        >
          <Button>选择</Button>
        </Upload>
      </div>
    </div>
  );
};

export default AvatarUpload;