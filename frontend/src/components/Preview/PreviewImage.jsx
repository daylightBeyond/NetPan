import React, { memo, useState, forwardRef, useImperativeHandle } from 'react';
import { Image, Modal } from 'antd';

const PreviewImage = forwardRef((props, ref) => {
  console.log('PreviewImage--ref', ref)
  const { imageList } = props;

  console.log('imageList', imageList);

  const [previewImageIndex, setPreviewImageIndex] = useState(null);
  const [previewVisible, setPreViewVisible] = useState(false);

  useImperativeHandle(ref, () => {
    return {
      show
    }
  })

  const show = (index) => {
    setPreviewImageIndex(index);
    setPreViewVisible(true)
  };

  const closeImageViewer = () => {
    setPreviewImageIndex(null);
  };

  return (
    <div className="image-revier">
      <Modal
        open={previewVisible}
        footer={null}
        styles={{ padding: 0 }}
        onCancel={() => setPreViewVisible(false)}
      >
        <Image
          style={{ width: '100%', height: '100' }}
          // width={200}
          src={imageList}
          // preview={false}
        />
      </Modal>

    </div>
  );
});

PreviewImage.defaultProps = {
  imageList: []
};

export default memo(PreviewImage);
