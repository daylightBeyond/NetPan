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
  const {
    watchProp, // 是否监听路由
    shareId, // 分享ID
    adminShow, // 是否展示管理员模块
    navChange, // 导航切换
  } = props;
  const routeParams = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useMergeState({
    folderList: [], // 目录集合
    currentFolder: {fileId: '0'}, // 当前目录
  });

  const { folderList, currentFolder } = state;

  const queryParams = qs.parse(location.search, { ignoreQueryPrefix: true });

  useImperativeHandle(ref, () => {
    return {
      openFolder,
      clearFolder,
    }
  });

  // 获取当前路径的目录
  const getNavigationFolder = (path) => {
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
        const pathArr = path.split('/');
        setState({
          folderList: res.data,
          currentFolder: { fileId: pathArr[pathArr.length - 1] }
        })
        doCallback({ fileId: pathArr[pathArr.length - 1] })
      }
    }).catch(e => {
      console.log(e);
    });
  };

  useEffect(() => {
    // 只有在监听路由和在home下才会执行监听路由操作
    if (watchProp && location.pathname.indexOf('/home') !== -1) {
      const path = queryParams.path;

      if (path) {
        getNavigationFolder(path);
      }
    }
  }, [queryParams.path]);

  const openFolder = (data) => {
    console.log('openFolder--data', data);
    const { fileId, fileName } = data;
    const folder = { fileId, fileName };
    setState({
      folderList: [...folderList, folder],
      currentFolder: folder
    });
  };

  const clearFolder = () => {
    setState({
      folderList: [],
      currentFolder: { fileId: '0' }
    });
  };

  useEffect(() => {
    setPath();
  }, [currentFolder]);

  const setPath = () => {
    if (!watchProp) {
      doCallback(currentFolder)
      return;
    }
    const pathArr = [];
    folderList.forEach(item => {
      pathArr.push(item.fileId);
    });
    console.log('routeParams', routeParams);
    console.log('location', location);
    console.log('pathArr', pathArr);
    const menuCode = location.pathname.split('/')[1];
    navigate(`${location.pathname}${pathArr.length ? '?path=' + pathArr.join('/') : ''}`, {
      state: {
        menuCode,
      }
    });
  };

  // 返回上一级
  const backParent = () => {
    folderList.pop();
    const len = folderList.length;
    const tempCurFolder = len > 0 ? folderList[len - 1] : { fileId: '0' };
    setState({
      currentFolder: tempCurFolder,
      folderList,
    });

    // 因为在 folderList.length 为0 时，currentFolder 没有变成 { fileId: '0' }，暂时也不知道什么原因
    // 所以只能在 folderList 长度为0 的时候调用一次查询的方法
    if (len == 0) {
      doCallback({ fileId: '0' });
    }
  };

  // 点击导航，这是当前目录
  const handleCurrentFolder = (index) => {
    // index 为 -1 时，是跳到根目录，特殊处理
    if (index == -1) {
      // 返回全部
      setState({
        currentFolder: { fileId: '0' },
        folderList: []
      });
      doCallback({ fileId: '0' });
    } else {
      const newFolderList = folderList.slice();
      folderList.splice(index + 1, folderList.length);
      setState({
        currentFolder: newFolderList[index],
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
          <span className="back link" onClick={backParent}>返回上一级</span>
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
};

export default Navigation;
