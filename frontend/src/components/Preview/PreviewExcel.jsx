import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import request from "../../utils/request";
import './previewStyle.less';

const PreviewExcel = ({ url }) => {
  const [excelContent, setExcelContent] = useState(null);

  useEffect(() => {
    request({
      method: 'get',
      url,
      responseType: 'arraybuffer'
    }).then(res => {
      if (res) {
        let workbook = XLSX.read(new Uint8Array(res), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        setExcelContent(XLSX.utils.sheet_to_html(worksheet));
      }
    })
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: excelContent }} className="table-info"></div>
  );
};

PreviewExcel.defaultProps = {
  url: ''
};

export default PreviewExcel;
