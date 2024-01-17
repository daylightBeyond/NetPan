import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import { Divider } from 'antd';
import qs from 'qs';
import useMergeState from "../../hooks/useMergeState";
import useHomeStore from "../../store/homeStore";
import { getFileFolderInfo } from '@/servers/home';
import { getShareFolderInfo } from '@/servers/share';
import { getAdminFolderInfo } from '@/servers/admin';
import './style.less';

const Navigation = forwardRef((props, ref) => {
  //
  const {
    watchProp, // 是否监听路由
    shareId, // 分享ID
    adminShow, // 是否展示管理员模块
    navChange, // 导航切换
    preview
  } = props;
  const routeParams = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // console.log('Navigation--routeParams', routeParams);
  // console.log('Navigation--navigate', navigate);
  // console.log('Navigation--location', location);

  const [state, setState] = useMergeState({
    folderList: [], // 目录集合
    currentFolder: {fileId: '0'}, // 当前目录
  });

  const { folderList, currentFolder } = state;

  const queryParams = qs.parse(location.search, { ignoreQueryPrefix: true });

  useImperativeHandle(ref, () => {
    return {
      openFolder,
    }
  });

  // 获取当前路径的目录
  const getNavigationFolder = async (path) => {
    let request = getFileFolderInfo;
    if (shareId) {
      request = getShareFolderInfo;
    }
    if (adminShow) {
      request = getAdminFolderInfo;
    }
    const params = {
      path,
      shareId
    };
    request(params).then(res => {
      if (res.success) {
        const pathArr = path.split(',');

        setState({
          folderList: res.data,
          currentFolder: { fileId: pathArr[pathArr.length - 1] }
        }, () => doCallback({ fileId: pathArr[pathArr.length - 1] }));
      }
    }).catch(e => {
      console.log(e);
    });
  };

  useEffect(() => {
    console.log('location.search引起的useEffect', location.search);
    console.log('路由变化', location);
    console.log('路由参数', queryParams);
    // 只有在监听路由和在home下才会执行监听路由操作
    if (watchProp && location.pathname.indexOf('/home') !== -1) {
      const path = queryParams.path;

      if (path) {
        getNavigationFolder(path);
      }
    }
  }, [queryParams.path]);

  const init = () => {
    setState({
      folderList: [],
      currentFolder: { fileId: '0' }
    });
    // doCallback()
  };

  const openFolder = (data) => {
    const { fileId, fileName } = data;
    const folder = { fileId, fileName };
    setState({
      folderList: [...folderList, folder],
      currentFolder: folder
    });
  };

  useEffect(() => {
    console.log('folderList引起的useEffect', folderList);
    console.log('folderList引起的useEffect--currentFolder', currentFolder);
    // if (folderList.length) {
      setPath();
    // }
  }, [currentFolder]);

  const setPath = () => {
    if (!watchProp) {
      // TODO 设置不监听路由回调方法
      return;
    }
    const pathArr = [];
    folderList.forEach(item => {
      pathArr.push(item.fileId);
    });
    console.log('routeParams', routeParams);
    console.log('location', location);
    console.log('pathArr', pathArr);
    // TODO 为了保证一级二级路由正常的显示，最好还是用全局路由监听
    // navigate(`${location.pathname}?path=${pathArr.length ? pathArr.join('/') : ''}`);
    navigate(`${location.pathname}${pathArr.length ? '?path=' + pathArr.join('/') : ''}`);
  };

  // 点击导航，这是当前目录
  const handleCurrentFolder = (index) => {
    console.log('index', index);
    console.log('folderList', folderList);

    // index 为 -1 时，是跳到根目录，特殊处理
    if (index == -1) {
      // 返回全部
      setState({
        currentFolder: { fileId: '0' },
        folderList: []
      });
    } else {
      const newFolderList = folderList;
      folderList.splice(index + 1, folderList.length)
      setState({
        currentFolder: newFolderList,
        folderList: folderList
      });
    }
  };

  const doCallback = (currentFolder) => {
    navChange && navChange({
      curFolder: currentFolder
    });
  };

  return (
    <div className="top-navigation">
      {folderList.length > 0 && (
        <>
          <span className="back link">返回上一级</span>
          <Divider type="vertical" />
        </>
      )}

      {/* 没有进入文件夹下的全部文件 */}
      {folderList.length == 0 && <span className="all-file">全部文件</span>}
      {/* 进入文件夹下的全部文件，可以跳转的 */}
      {folderList.length > 0 && <span className="link" onClick={() => handleCurrentFolder(-1)}>全部文件</span>}

      {folderList?.map((item, index) => (
        <span key={item.fileId}>
          <span className="iconfont icon-right"></span>
          {index < folderList.length - 1 && (
            <span className="link" onClick={() => handleCurrentFolder(index)}>
              {item.fileName}
            </span>
          )}
          {index == folderList.length - 1 && (
            <span className="text">{item.fileName}</span>
          )}
        </span>
      ))}
    </div>
  );
});

Navigation.defaultProps = {
  watchProp: true,
  shareId: '',
  adminShow: false,
  preview () {},
};

export default Navigation;
