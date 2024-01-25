// 内部依赖
import React, { memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
// 外部依赖
import { Upload, Button, Input, message, Modal } from 'antd';
import dayjs from 'dayjs';
import qs from "qs";
// 组件
import Navigation from "../../components/Navigation/Navigation.jsx";
import NPTable from "../../components/Table/NPTable.jsx";
import FolderSelect from "../../components/FolderSelect/FolderSelect.jsx";
import ShareFile from "./ShareFile.jsx";
import Icon from "../../components/Icon/Icon.jsx";
import Preview from "../../components/Preview/index.jsx";
// 其他
import useMergeState from "@/hooks/useMergeState";
import useUploadFileStore from "@/store/uploadFileStore.js";
// 接口
import { queryFile, createFolder, rename, deleteFile, changeFileFolder, testUrl } from '../../servers/home';
// 方法
import { sizeToStr } from "../../utils/utils";
import categoryInfo from "../../constants/category-info";
// 样式
import '@/assets/file.list.less';
import './style.less';

const Home = () => {
  const routeParams = useParams();
  const location = useLocation();

  const queryParams = qs.parse(location.search, { ignoreQueryPrefix: true });

  const [state, setState] = useMergeState({
    currentFolder: { fileId: '0' },
    shareVisible: false, // 分享弹窗是否显示
    dataSource: [],
    pageNum: 1,
    pageSize: 10,
    total: 1,
    loading: false, // 查询数据加载

    selectedRowKeys: [],
    selectedRows: [],

    editing: false, // 判断是否已经有正在编辑中的行，有的话，就不让新增文件夹

    currentMoveFile: {}, // 当前移动的文件

    fileAcceptType: '*', // 上传文件接收的类型
    fileName: undefined, // 搜索时的文件名关键词
  });

  const {
    currentFolder, shareVisible, loading,
    dataSource, pageNum, pageSize, total, editing,
    selectedRowKeys, selectedRows,
    currentMoveFile, fileAcceptType, fileName
  } = state;

  const folderSelectRef = useRef(null);
  const navigationRef = useRef(null);
  const shareFileRef = useRef(null);
  const editNameRef = useRef(null);
  const previewRef = useRef(null);

  // store的变量和方法
  const queryFileFlag = useUploadFileStore(state => state.queryFileFlag);
  const setQueryFileFlag = useUploadFileStore(state => state.setQueryFileFlag);
  const addFile = useUploadFileStore(state => state.addFile);
  const setShowUploader = useUploadFileStore(state => state.setShowUploader);

  // 路由参数变化查询文件列表
  useEffect(() => {
    // 获取上传文件的类型
    const categoryItem = categoryInfo[routeParams.category];
    setState({ fileAcceptType: categoryItem ? categoryItem.accept : '*' });

    // 这一步是为了二级路由在 全部 的情况下，进入了下一层文件夹下，然后再跳转到别的二级路由，
    // 例如: 视频，图片 的这些情况，需要清空 当前 currentFolder 的信息，
    // 并且 Navigation 组件也需要清空
    if (routeParams.category !== 'all') {
      setState({ currentFolder: { fileId: '0' } });
      navigationRef.current.clearFolder();
    }

    // 这一步是防止进入了子文件后，点浏览器刷新，重复调用接口
    if (queryParams.path) {
      return;
    }
    queryFileList({ pageNum: 1, pageSize: 10 });
  }, [routeParams.category]);

  // 文件上传后引发的查询文件列表
  useEffect(() => {
    // queryFileFlag 为 true 时才重新调用查询文件接口
    if (queryFileFlag) {
      queryFileList({ pageNum: 1, pageSize: 10 });
    }
  }, [queryFileFlag]);

  const queryFileList = (params = {}) => {
    console.log('查询列表时的currentFolder', currentFolder);
    const queryParams = {
      pageNum,
      pageSize,
      fileName,
      category: routeParams.category,
      filePid: currentFolder.fileId,
      ...params,
    };
    setState({ loading: true });
    queryFile(queryParams).then(res => {
      if (res?.success) {
        const { list, pageNum, pageSize, total } = res.data || {};
        setState({
          dataSource: list,
          pageNum,
          pageSize,
          total,
          selectedRows: [],
          selectedRowKeys: [],
          loading: false
        });
      }
      if (queryFileFlag) {
        setQueryFileFlag(false);
      }
    })
  };

  /*
   * 由于Home组件和Uploader组件无任何关联，但是又需要点上传的时候触发 Uploader组件的方法，
   * 单靠组件间传值不方便处理，最好的方法是用状态管理
   */
  const customRequest = (options) => {
    console.log('options', options);
    const { file } = options;
    addFile({ file, filePid: currentFolder.fileId });
    setShowUploader(true);
  };

  const uploadProps = {
    multiple: true,
    showUploadList: false,
    accept: fileAcceptType,
    customRequest
  };

  // 预览
  const preview = (data) => {
    // 目录，跳转
    if (data.folderType == 1) {
      navigationRef.current.openFolder(data);
      return;
    }
    // 文件
    if (data.status != 2) {
      message.warning('文件未完成转码，无法预览');
      return;
    }
    previewRef.current.showPreview(data, 0);
  };

  // 更改输入值的回调
  const onNameChange = (value, fileId) => {
    const newDataSource = dataSource.map(item => {
      if (item.fileId == fileId) {
        return { ...item, fileNameReal: value.trim() };
      }
      return item;
    });

    setState({ dataSource: newDataSource });
  };

  const saveNameEdit = async (index) => {
    const { fileId, filePid, fileNameReal } = dataSource[index];

    if (fileNameReal == '' || fileNameReal.indexOf('/') != -1) {
      message.warning('文件名不能为空且不能含有斜杠/');
      return;
    }
    let request = rename;
    if (fileId == '') {
      request = createFolder;
    }
    const params = {
      fileId,
      filePid,
      fileName: fileNameReal,
    };
    request(params).then(res => {
      if (res.success) {
        res.data['showEdit'] = false;
        dataSource[index] = res.data;
        setState({
          dataSource,
          editing: false,
        });
        queryFileList();
      }
    }).catch(e => {
      console.log('新建文件目录异常', e);
    })
  };

  const cancelNameEdit = (index) => {
    const fileData = dataSource[index];
    if (fileData.fileId) { // 重命名的情况
      dataSource[index].showEdit = false
      setState({ dataSource: [...dataSource] });
    } else { // 新增文件夹的情况
      const newData = dataSource.filter(x => x.fileId != fileData.fileId);
      setState({
        dataSource: newData,
        // editing: false
      });
    }

    setState({ editing: false });
  };

  // 分享
  const share = (row) => {
    console.log('share--row', row);
    console.log('shareFileRef', shareFileRef);
    shareFileRef.current.show(row);
  };

  // 下载文件
  const handleDownloadFile = () => {

  };

  // 删除文件
  const handleDelFile = (row) => {
    Modal.confirm({
      title: '批量删除文件',
      content: `你确定要删除【${row.fileName}】吗？删除的文件可在10天内通过回收站还原`,
      onOk: () => {
        const params = {
          fileIds: row.fileId
        };
        deleteFile(params).then(res => {
          if (res?.success) {
            message.success('删除文件成功，可在回收站查看');
            queryFileList();
          }
        }).catch(e => {
          console.log('删除文件异常', e);
        })
      }
    });
  };

  // 文件重命名
  const handleRenameFile = (index) => {
    // 如果重命名的时候，刚好是新建文件夹，即第一行是编辑的状态
    if (dataSource[0].fileId == '') {
      dataSource.splice(0, 1);
      setState({ dataSource: [...dataSource] });
      index = index - 1;
    }
    dataSource.forEach(item => item.showEdit = false);
    const currentData = dataSource[index];
    currentData.showEdit = true;
    // 编辑文件
    if (currentData.folderType == 0) {
      currentData.fileNameReal = currentData.fileName.substring(0, currentData.fileName.lastIndexOf('.'));
      currentData.fileSuffix = currentData.fileName.substring(currentData.fileName.lastIndexOf('.'));
    } else {
      currentData.fileNameReal = currentData.fileName;
      currentData.fileSuffix = '';
    }
    dataSource[index] = currentData;
    setState({
      dataSource: [...dataSource],
      editing: true
    });
  };

  // 移动文件(单个)
  const handleMoveFile = (data) => {
    setState({ currentMoveFile: data });
    folderSelectRef.current.showFolder(currentFolder.fileId);
  };

  const columns = [
    {
      title: "文件名",
      key: "fileName",
      dataIndex: "fileName",
      render: (text, record, index) => {
        const { fileType, folderType, status, fileCover, showEdit, fileNameReal, showOp, fileId, fileSuffix } = record;
        return (
          <div
            className="file-item"
            onMouseEnter={() => handleShowOp(record, index)}
            onMouseLeave={() => handleCancelShowOp(record)}
          >
            {/* 封面 */}
            {/* status: 0:转码中 1:转码失败 2:转码成功 */}
            {(fileType == 3 || fileType == 1) && status == 2 ? (
              <Icon cover={fileCover} width={32}/>
            ) : (
              <>
                {folderType == 0 && <Icon fileType={fileType} />}
                {folderType == 1 && <Icon fileType={0} />}
              </>
            )}

            {/* 文件名，编辑状态下就不显示文件名 */}
            {!showEdit && (
              <span className="file-name">
                <span onClick={() => preview(record)}>{text}</span>
                {status == 0 && <span className="transfer-status">转码中</span>}
                {status == 1 && <span className="transfer-status transfer-fail">转码失败</span>}
              </span>
            )}

            {/* 编辑时，显示编辑框 */}
            <div className="edit-panel" style={{ display: showEdit ? '' : 'none' }}>
              <Input
                maxLength={190}
                ref={editNameRef}
                value={record.fileNameReal}
                onChange={(e) => onNameChange(e.target.value, record.fileId)}
                onPressEnter={() => saveNameEdit(index)}
                suffix={fileSuffix}
              />
              <span className={`iconfont icon-right1 ${fileNameReal ? '' : 'not-allow'}`} onClick={() => saveNameEdit(index)}></span>
              <span className="iconfont icon-error" onClick={() => cancelNameEdit(index)}></span>
            </div>

            {/* 操作项 */}
            <span className="op">
              {showOp && fileId && status === 2 && (
                <>
                  <span className="iconfont icon-share1" onClick={() => share(record)}>分享</span>
                  <span className="iconfont icon-download" onClick={() => handleDownloadFile(index)}>下载</span>
                  <span className="iconfont icon-del" onClick={() => handleDelFile(record)}>删除</span>
                  <span className="iconfont icon-edit" onClick={() => handleRenameFile(index)}>重命名</span>
                  <span className="iconfont icon-move" onClick={() => handleMoveFile(record)}>移动</span>
                </>
              )}
            </span>
          </div>
        )
      }
    },
    {
      title: "修改时间",
      key: "lastUpdateTime",
      dataIndex: "lastUpdateTime",
      width: 200,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    {
      title: "大小",
      key: "fileSize",
      dataIndex: "fileSize",
      width: 200,
      render: (text) => text ? sizeToStr(text) : '',
    },
  ];

  const onSelectChange = (rowKeys, rows) => {
    setState({
      selectedRowKeys: rowKeys,
      selectedRows: rows
    });
  };

  const rowSelection = {
    width: 60,
    selectedRowKeys,
    selectedRows,
    onChange: onSelectChange
  };

  // 新建文件夹
  const newFolder = () => {
    if (editing) {
      return;
    }
    const newData = {
      showEdit: true, // 是否显示编辑状态
      fileType: 0, // 0 文件夹
      fileNameReal: '',
      fileId: '',
      filePid: currentFolder.fileId
    };
    setState({
      dataSource: [newData, ...dataSource],
      editing: true
    });
    // editNameRef.current.focus();
  };

  // 批量删除文件
  const deleteFileBatch = () => {
    if (!selectedRowKeys.length) {
      return;
    }

    Modal.confirm({
      title: '批量删除文件',
      content: '你确定要啊删除这些文件吗？删除的文件可在10天内通过回收站还原',
      onOk: () => {
        const params = {
          fileIds: selectedRowKeys.join(',')
        };
        deleteFile(params).then(res => {
          if (res?.success) {
            message.success('批量删除文件成功，可在回收站查看');
            queryFileList();
          }
        }).catch(e => {
          console.log('批量删除文件异常', e);
        })
      }
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setState({ fileName: value });
    queryFileList({ fileName: value });
  };

  // 批量移动文件
  const moveFileBatch = () => {
    setState({ currentMoveFile: {} });
    folderSelectRef.current.showFolder(currentFolder.fileId);
  };

   // 移动文件的回调
   const folderMoveDone = async (folderId) => {
     console.log(folderId);
     if (currentFolder.fileId == folderId) {
       message.warning('文件正在当前目录，无需移动');
       return;
     }

     let fileIdsArray = [];
     if (currentMoveFile.fileId) { // 单个移动
       fileIdsArray.push(currentMoveFile.fileId);
     } else { // 批量移动
       fileIdsArray = fileIdsArray.concat(selectedRowKeys);
     }
     try {
       const params = {
         fileIds: fileIdsArray.toString(),
         filePid: folderId
       };
       const res = await changeFileFolder(params);
       console.log('移动文件', res);
       if (res.success) {
         folderSelectRef.current.close();
        queryFileList();
       }
     } catch (e) {
       console.log(e);
     }
   };

  // 展示操作按钮
  const handleShowOp = useCallback((row, index) => {
    dataSource.map(item => {
      item.showOp = false;
    })
    row.showOp = true;
    // 更新state，不然页面是不会出现或消失操作项
    setState(() => {});
  }, []);

  const handleCancelShowOp = useCallback((row) => {
    row.showOp = false;
    // 更新state，不然页面是不会出现或消失操作项
    setState(() => {});
  }, []);

  const navChange = (data) => {
    const { curFolder } = data;
    setState({ currentFolder: curFolder });
    queryFileList({ filePid:  curFolder.fileId });
  };

  return (
    <div className="wrapper-home">
      <div className="top">
        <div className="top-op">
          <div className="btn">
            <Upload {...uploadProps}>
              <Button style={{ backgroundColor: '#409eff' }}>
                <span className="iconfont icon-upload">
                  上传
                </span>
              </Button>
            </Upload>
          </div>
          <Button onClick={newFolder} style={{ backgroundColor: '#67c23a' }}>
            <span className="iconfont icon-folder-add">
              新建文件夹
            </span>
          </Button>
          <Button type="primary" danger disabled={!selectedRowKeys.length} onClick={deleteFileBatch}>
            <span className="iconfont icon-del">
              批量删除
            </span>
          </Button>
          <Button
            type="primary"
            style={{
              backgroundColor: '#e6a23c',
              cursor: selectedRowKeys.length ? '' : 'not-allowed'
            }}
            disabled={!selectedRowKeys.length}
            onClick={moveFileBatch}
          >
            <span className="iconfont icon-move">
              批量移动
            </span>
          </Button>
          <div className="search-panel">
            <Input placeholder="输入文件名搜索" onPressEnter={handleSearch}/>
          </div>
          <div className="iconfont icon-refresh" onClick={() => queryFileList()}></div>
        </div>
        {/* 导航 */}
        <div className="top-navigation">
          <span className="all-file">
            <Navigation ref={navigationRef} navChange={navChange} />
          </span>
        </div>
      </div>

      {dataSource.length > 0 ? (
        // 文件列表
        <div className="file-list">
          <NPTable
            loading={loading}
            dataSource={dataSource}
            columns={columns}
            total={total}
            rowKey="fileId"
            rowSelection={rowSelection}
          />
        </div>
      ) : (
        <div className="no-data">
          <div className="no-data-inner">
            <Icon iconName="no_data" width={120} />
            <div className="tips">当前目录为空，上传你的第一个文件吧</div>
            <div className="op-list">
              <Upload {...uploadProps}>
                <div className="op-item">
                  <Icon iconName="file" width={60} />
                  <div>上传文件</div>
                </div>
              </Upload>
              {routeParams.category == 'all' && (
                <div onClick={newFolder} className="op-item">
                  <Icon iconName="folder" width={60} />
                  <div>新建目录</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 分享 */}
      <ShareFile
        ref={shareFileRef}
        open={shareVisible}
        changeState={(data) => setState(data)}
      />

      {/* 移动文件弹窗 */}
      <FolderSelect
        ref={folderSelectRef}
        folderSelect={folderMoveDone}
      />

      {/* 预览 */}
      <Preview ref={previewRef} />
    </div>
  );
};

export default memo(Home);
