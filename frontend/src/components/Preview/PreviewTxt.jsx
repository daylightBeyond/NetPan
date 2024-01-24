import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import request from "../../utils/request";
import './previewStyle.less';
import 'react-syntax-highlighter/dist/esm/styles/prism/tomorrow';

const PreviewTxt = ({ url, fileName }) => {
  const fileType = fileName.slice(fileName.lastIndexOf('.') + 1);
  const [blobResult, setBlobResult] = useState('');

  useEffect(() => {
    request({
      method: 'get',
      url,
      responseType: 'blob'
    }).then(async res => {
      if (res) {
        const text = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result);
          };
          reader.readAsText(res);
        });

        setBlobResult(text);
      }
    })
  }, []);

  return (
    <div className="code">
      <SyntaxHighlighter language={fileType}>
        {blobResult}
      </SyntaxHighlighter>
    </div>
  );
};

PreviewTxt.defaultProps = {
  url: ''
};

export default PreviewTxt;
