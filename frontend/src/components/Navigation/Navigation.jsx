import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate} from 'react-router-dom';
import qs from 'qs';
import useMergeState from "../../hooks/useMergeState";
import './style.less';

const Navigation = (props) => {
  const { watchProp, preview } = props;
  const routeParams = useParams();
  const router = useNavigate();
  const location = useLocation();
  // console.log('Navigation--routeParams', routeParams);
  // console.log('Navigation--router', router);
  // console.log('Navigation--location', location);

  const [state, setState] = useMergeState({
    folderList: [],
    currentFolder: {fileId: '0'},
  });

  const { folderList, currentFolder } = state;

  const openFolder = (data) => {
    const { fileId, fileName } = data;
    const folder = { fileId, fileName };
    setState({
      folderList: [...folderList, folder],
      currentFolder: folder
    });
    setPath();
  };

  const setPath = () => {
    if (!watchProp) {
      // TODO 设置不监听路由回调方法
      return;
    }
    const pathArr = [];
    folderList.forEach(item => {
      pathArr.push(item.fileId);
    });
    router(`${location.pathname}?${pathArr.length ? '' : pathArr.join('/')}`);
  };

  return (
    <div className="top-navigation">
      全部文件
    </div>
  );
};

Navigation.defaultProps = {
  watchProp: true,
  preview () {},
};

export default Navigation;
