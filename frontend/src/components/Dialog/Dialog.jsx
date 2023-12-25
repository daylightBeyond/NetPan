import React from 'react';
import { Modal } from 'antd';
import './style.less';

/**
 * @description 对话框组件
 * @param {string} title 对话框的样式
 * @param {object} style 对话框的样式
 * @param {string|number} width 对话框的宽度
 * @param {string|number} top 对话框距离顶部的高度
 * @param {string|number} padding 对话框的内部差距离
 * @param {boolean} open 控制窗口显示
 * @param {Array} buttons 对话框底部按钮
 * @param {function} close 关闭对话框
 * @param {function} changeState 修改引用组件state的回调
 * @param children 对话框渲染内容
 * */
const Dialog = (props) => {
  console.log('Modal', props);
  const {
    children,
    title = 'Modal',
    open = false,
    width = '30%',
    top = 30,
    style = {},
    padding = 10
  } = props;
  const onOk = () => {

  };
  const onCancel = () => {

  };
  const maxHeight = window.innerHeight - top - 100;
  return (
    <Modal
      title={title}
      open={open}
      width={width}
      style={style}
      onOk={onOk}
      onCancel={onCancel}
    >
      <div
        className="dialog-body"
        style={{ maxHeight, padding }}
      >
        {children}
      </div>

    </Modal>
  );
};


export default Dialog;