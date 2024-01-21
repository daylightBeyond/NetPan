import React, { useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Modal } from "antd";
import Navigation from "../Navigation/Navigation.jsx";
import Icon from "../Icon/Icon.jsx";
import useMergeState from "@/hooks/useMergeState";
import { loadAllFolder } from '@/servers/home';
import './style.less';

const FolderSelect = forwardRef((props, ref) => {
  const { folderSelect } = props;
  const [state, setState] = useMergeState({
    open: false,

    filePid: '0',
    folderList: [],
    currentFileIds: {},
    currentFolder: {},
  });

  const { open, filePid, folderList, currentFileIds, currentFolder } = state;

  const navigationRef = useRef(null);

  useImperativeHandle(ref, () => {
    return {
      showFolder,
      close: onCancel,
    }
  });

  const showFolder = (currentFolder) => {
    setState({
      open: true,
      currentFileIds: currentFolder
    });
    getAllFolder();
  };

  const getAllFolder = (params) => {
    const queryParams = {
      filePid,
      fileIds: currentFileIds,
      ...params
    };
    loadAllFolder(queryParams).then(res => {
      console.log('加载所有目录', res);
      if (res.success) {
        setState({
          folderList: res.data
        })
      }
    }).catch(e => {
      console.log('加载文件目录异常', e);
    })
  };

  // 确定选择目录
  const onOk = () => {
    folderSelect && folderSelect(filePid);
  };

  const onCancel = () => {
    setState({ open: false });
  };

  // 选择文件进行导航跳转
  const selectFolder = (data) => {
    navigationRef.current.openFolder(data);
  };

  // 导航改变回调
  const navChange = (data) => {
    const { curFolder } = data;
    setState({
      currentFolder: curFolder,
      filePid: curFolder.fileId
    });
    getAllFolder({ filePid:  curFolder.fileId });
  };

  return (
    <Modal
      open={open}
      title="移动到"
      okText="移动到此"
      width={600}
      onOk={onOk}
      onCancel={onCancel}
      className="folder-select"
    >
      <div className="navigation-panel">
        <Navigation ref={navigationRef} navChange={navChange} watchProp={false}/>
      </div>
      {
        folderList.length ? (
          <div className="folder-list">
            {folderList.map(item => (
              <div
                key={item.fileId}
                className="folder-item"
                onClick={() => selectFolder(item)}
              >
                <Icon folderType={0} />
                <span className="file-name">{item.fileName}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="tips">
            移动<span>{currentFolder.fileName}</span>
          </div>
        )
      }
    </Modal>
  );
});

export default FolderSelect;
