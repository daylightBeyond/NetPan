import React, { useState } from 'react';

const useMergeState = (initialState) => {
  const [state, setState] = useState(initialState);
  const setMergeState = (pickState) => {
    setState(preState => { // preState存储的是上一次的状态值
      return { ...preState, ...pickState };
    });
  };

  return [state, setMergeState];
};

export default  useMergeState;