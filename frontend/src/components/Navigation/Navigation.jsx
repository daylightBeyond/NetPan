import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import qs from 'qs';
import useMergeState from "../../hooks/useMergeState";
import { getFileFolderInfo } from '@/servers/home';
import { getShareFolderInfo } from '@/servers/share';
import { getAdminFolderInfo } from '@/servers/admin';
import './style.less';

const Navigation = forwardRef((props, ref) => {
  const { watchProp, shareId, adminShow, preview } = props;
  const routeParams = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  console.log('Navigation--routeParams', routeParams);
  // console.log('Navigation--navigate', navigate);
  console.log('Navigation--location', location);

  const [state, setState] = useMergeState({
    folderList: [], // 目录集合
    currentFolder: {fileId: '0'}, // 当前目录

    category: '', // 分类
  });

  const { folderList, currentFolder } = state;

  const queryParams = qs.parse(location.search, { ignoreQueryPrefix: true });
  console.log('queryParams', queryParams);

  useImperativeHandle(ref, () => {
    return {
      openFolder,
    }
  });

  // 获取当前路径的目录
  const getNavigationFolder = async (path) => {
    let request = getFileFolderInfo;
    try {
      if (shareId) {
        request = getShareFolderInfo;
      }
      if (adminShow) {
        request = getAdminFolderInfo;
      }
      const params = {
        path,
        shareId
      }
      const res  = await request(params);
      console.log('获取文件目录信息', res);
      if (res.success) {
        // setState({ folderList: res.data });
      }
    } catch (e) {

    }
  };

  useEffect(async () => {
    console.log('路由变化', location);
    if (!watchProp) {
      return
    }

    // 只有是在home路由下才需要展示文件夹
    if (location.pathname.indexOf('/home') !== -1) {
      return;
    }

    const path = queryParams.path;

    setState({
      category: routeParams.category,
    });

    if (!path) {

    } else {
      await getNavigationFolder(path);
      let pathArray = path.split('/');
      setState({
        currentFolder: {
          fileId: pathArray[pathArray.length - 1]
        }
      })
    }
  }, [location]);



  const openFolder = (data) => {
    const { fileId, fileName } = data;
    const folder = { fileId, fileName };
    setState({
      folderList: [...folderList, folder],
      currentFolder: folder
    });
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
  shareId: '',
  adminShow: false,
  preview () {},
};

export default Navigation;
