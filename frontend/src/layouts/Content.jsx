import React, { lazy, useEffect, useState } from 'react';
import { useParams, useLocation } from "react-router-dom";

const Content = (props) => {
  console.log('props', props);
  const routeParams = useParams();
  const routeLocation = useLocation();
  console.log('routeParams', routeParams);
  console.log('routeLocation', routeLocation);

  return (
    <div>
      { routeLocation.pathname }
    </div>
  );
};

export default Content;
