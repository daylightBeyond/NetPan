import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import qs from 'qs';
import useMergeState from "../../hooks/useMergeState";
import { getFileFolderInfo } from '@/servers/home';
import { getShareFolderInfo } from '@/servers/share';
import { getAdminFolderInfo } from '@/servers/admin';
import './style.less';

const Navigation = forwardRef((props, ref) => {
  const { watchProp, preview } = props;
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

  useImperativeHandle(ref, () => {
    return {
      openFolder,
    }
  })

  const openFolder = (data) => {
    console.log('caccacasdca')
    const { fileId, fileName } = data;
    const folder = { fileId, fileName };
    setState({
      folderList: [...folderList, folder],
      currentFolder: folder
    });
    // debugger
    // setPath();
  };

  useEffect(() => {
    if (folderList.length) {
      setPath();
    }
  }, [folderList, currentFolder]);

  const setPath = () => {
    if (!watchProp) {
      // TODO 设置不监听路由回调方法
      return;
    }
    debugger
    const pathArr = [];
    folderList.forEach(item => {
      pathArr.push(item.fileId);
    });
    console.log('routeParams', routeParams);
    console.log('location', location);
    console.log('pathArr', pathArr);
    // TODO 为了保证一级二级路由正常的显示，最好还是用全局路由监听
    navigate(`${location.pathname}?path=${pathArr.length ? pathArr.join('/') : ''}`);
  };

  return (
    <div className="top-navigation">
      全部文件
    </div>
  );
});

Navigation.defaultProps = {
  watchProp: true,
  preview () {},
};

export default Navigation;
