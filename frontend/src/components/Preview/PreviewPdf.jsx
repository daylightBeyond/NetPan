import React, { useState } from 'react';
import { Button } from "antd";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;


const serverUrl = 'http://192.168.136.130:7090';

const PreviewPdf = ({ filePath }) => {
  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
  };

  const handleNextPage = () => {
    setPageNumber((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setPageNumber((prevPage) => Math.max(1, prevPage - 1));
  };

  return (
    <>
      <Document file={serverUrl + '/' + filePath} onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
      <div style={{ textAlign: 'center' }}>
        <Button onClick={handlePrevPage} disabled={pageNumber === 1}>
          上一页
        </Button>
        <span>&nbsp;&nbsp;{pageNumber}&nbsp;&nbsp;</span>
        <Button onClick={handleNextPage} disabled={pageNumber === numPages}>下一页</Button>
      </div>
    </>
  );
};

PreviewPdf.defaultProps = {
  url: ''
};

export default PreviewPdf;
