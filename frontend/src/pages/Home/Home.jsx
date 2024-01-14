// 内部依赖
import React, { memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
// 外部依赖
import { Upload, Button, Input, message } from 'antd';
import dayjs from 'dayjs';
// 组件
import Navigation from "../../components/Navigation/Navigation.jsx";
import NPTable from "../../components/Table/NPTable.jsx";
import ShareFile from "./ShareFile.jsx";
import Icon from "../../components/Icon/Icon.jsx";
import EditableRow from "./components/EditableRow.jsx";
import EditableCell from "./components/EditableCell.jsx";
// 其他
import useMergeState from "@/hooks/useMergeState";
import useUploadFileStore from "@/store/uploadFileStore.js";
// 接口
import { queryFile, createFolder, rename } from '../../servers/home';
// 方法
import { sizeToStr } from "../../utils/utils";
// 样式
import '@/assets/file.list.less';
import './style.less';

const Home = () => {
  const routeParams = useParams();
  // console.log('routeParams', routeParams);

  const [state, setState] = useMergeState({
    currentFolder: { fileId: 0 },
    shareVisible: false, // 分享弹窗是否显示
    dataSource: [],
    pageNum: 1,
    pageSize: 10,
    total: 1,
    loading: false, // 查询数据加载

    selectedRowKeys: [],
    selectedRows: [],

    editing: false, // 判断是否已经有正在编辑中的行，有的话，就不让新增文件夹
  });

  const {
    currentFolder, shareVisible, loading,
    dataSource, pageNum, pageSize, total, editing,
    selectedRowKeys, selectedRows,
  } = state;

  const shareFileRef = useRef(null);
  const editNameRef = useRef(null);

  // store的变量和方法
  const addFile = useUploadFileStore(state => state.addFile);
  const setShowUploader = useUploadFileStore(state => state.setShowUploader);

  useEffect(() => {
    queryFileList({ pageNum: 1, pageSize: 10 });
  }, [routeParams]);

  const queryFileList = (params = {}) => {
    const queryParams = {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
      category: routeParams.category,
      fileName: params.fileName
    };
    queryFile(queryParams).then(res => {
      // console.log('查询文件列表', res);
      if (res.success) {
        const { list, pageNum, pageSize, total } = res.data || {};
        setState({
          dataSource: list,
          pageNum,
          pageSize,
          total
        });
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
    customRequest
  };

  // 预览
  const preview = (data) => {
    if (data.folderType == 1) { // 目录

    }
  };

  // 更改输入值的回调
  const onNameChange = (value, fileId) => {
    console.log('value', value)
    console.log('fileId', fileId)
    console.log('editRef', editNameRef)
    if (value && value.trim()) {
      const newDataSource = dataSource.map(item => {
        if (item.fileId == fileId) {
          return { ...item, fileNameReal: value.trim() };
        }
        return item;
      })
      console.log('newDataSource', newDataSource)

      setState({ dataSource: newDataSource });
    }
  };

  const saveNameEdit = async (index) => {
    const { fileId, filePid, fileNameReal } = dataSource[index];

    if (fileNameReal == '' || fileNameReal?.indexOf('/') != -1) {
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
      console.log('保存文件', res);
      if (res.success) {
        res.data['showEdit'] = false;
        dataSource[index] = res.data;
        setState({
          dataSource,
          editing: false,
        });
        queryFileList()
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
      // fileData.showEdit = false;
    } else { // 新增文件夹的情况
      const newData = dataSource.filter(x => x.fileId != fileData.fileId);
      setState({
        dataSource: newData,
        // editing: false
      });
    }

    setState({ editing: false });
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell
    }
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
  const handleDelFile = () => {

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
    })
  };

  // 移动文件
  const handleMoveFile = () => {

  };

  const columns = [
    {
      title: "文件名",
      key: "fileName",
      dataIndex: "fileName",
      // editable: true,
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
                suffix={record.fileSuffix}
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
      render: (text) => text ? sizeToStr(text) : '-',
    },
  ];

  const columns11 = columns.map(col => {
    // if (!col.editable) {
    //   return col;
    // }
    return {
      ...col,
      onCell: (record) => ({
        record,
        // editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: saveNameEdit,
      })
    }
  });

  const tableOptions = {
    extHeight: 50,
    selectType: 'checkbox'
  };

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
    console.log('editing', editing);
    if (editing) {
      return;
    }
    const newData = {
      showEdit: true, // 是否显示编辑状态
      fileType: 0, // 0 文件夹
      fileNameReal: '',
      fileId: '',
      filePid: '0'
    };
    setState({
      dataSource: [newData, ...dataSource],
      editing: true
    }, () => {
      editNameRef.current.focus();
    });
  };
  const newFolder11 = () => {
    console.log(dataSource)
    if (!editing) {
      return;
    }

    // const newDataSource =
      dataSource.forEach((element) => element.showEdit = false);
    setState({ editing: true });
    // newDataSource.unshift({
    //   showEdit: true,
    //   fileType: 0, // 0 文件夹
    //   fileId: '',
    //   filePid: '0'
    // });
    dataSource.unshift({
      showEdit: true, // 是否显示编辑状态
      fileType: 0, // 0 文件夹
      fileId: '',
      filePid: '0'
    });
    setState({
      dataSource: dataSource
    });
    editNameRef.current.focus();
    console.log('editNameRef', editNameRef);
  }

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
          <Button type="primary" danger disabled={!selectedRowKeys.length}>
            <span className="iconfont icon-del">
              批量删除
            </span>
          </Button>
          <Button
            type="primary"
            style={{
              backgroundColor: '#f3d19e',
              cursor: selectedRowKeys.length ? '' : 'not-allowed'
            }}
            disabled={!selectedRowKeys.length}
          >
            <span className="iconfont icon-move">
              批量移动
            </span>
          </Button>
          <div className="search-panel">
            <Input placeholder="输入文件名搜索"/>
          </div>
          <div className="iconfont icon-refresh" onClick={queryFileList}></div>
        </div>
        {/* 导航 */}
        <div className="top-navigation">
          <span className="all-file">
            <Navigation preview={preview} />
          </span>
        </div>
      </div>
      {/* 文件列表 */}
      <div className="file-list">
        <NPTable
          // components={components}
          dataSource={dataSource}
          columns={columns}
          total={total}
          rowKey="fileId"
          options={tableOptions}
          rowSelection={rowSelection}
        />
      </div>

      {/* 分享 */}
      <ShareFile
        ref={shareFileRef}
        open={shareVisible}
        changeState={(data) => setState(data)}
      />
    </div>
  );
};

export default memo(Home);
