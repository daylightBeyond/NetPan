import React, { useState } from 'react';
import { Modal, Form, message } from 'antd';
import { updateUserAvatar } from '@/servers/home.js';
import AvatarUpload from "@/components/Avatar/AvatarUpload.jsx";

const { Item } = Form;
const UpdateAvatar = (props) => {
  const { changeState, open, updateAvatar } = props;

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
  const handleOk = async () => {
    console.log('formData', formData);
    if(!(formData.avatar instanceof File)) {
      handleCancel();
      return;
    }
    setLoading(true);
    const form = new FormData();
    form.append('avatar', formData.avatar);
    form.append('userId', userInfo.userId);
    const res = await updateUserAvatar(form);
    if (res.success === true) {
      message.success('更新头像成功');
      updateAvatar();
      setLoading(false);
      handleCancel();
    }
  };

  const handleCancel = () => {
    changeState({ avatarVisible: false });
  };
  return (
    <Modal
      title="更新头像"
      width="30%"
      confirmLoading={loading}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <div
        style={{
          borderTop: '1px solid #ddd',
          borderBottom: '1px solid #ddd',
          minHeight: '1px solid #ddd',
          overflow: 'auto',
        }}
      >
        <Form
          preserve={false} // 搭配 Modal 使用，Modal 关闭时销毁表单字段数据
        >
          <Item label="用户名">
            {userInfo.username}
          </Item>
          <Item label="头像">
            <AvatarUpload userId={userInfo.userId} setFormData={(data) => setFormData(data)}/>
          </Item>
        </Form>
      </div>
    </Modal>
  );
};

export default UpdateAvatar;
