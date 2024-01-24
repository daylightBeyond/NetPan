import React, { useEffect, useRef } from 'react';
import * as docx from 'docx-preview';
import request from "../../utils/request";
import './previewStyle.less';

const PreviewDoc = ({ url }) => {
  const docRef = useRef(null);

  useEffect(() => {
    request({
      method: 'get',
      url,
      responseType: 'blob'
    }).then(res => {
      if (res) {
        docx.renderAsync(res, docRef.current);
      }
    })
  }, []);

  return (
    <div ref={docRef} className="doc-content"></div>
  );
};

PreviewDoc.defaultProps = {
  url: ''
};

export default PreviewDoc;
