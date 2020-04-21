import React from "react";

import style from "./Loader.module.css";

const LoaderComponent = () => (
  <div role="alert" aria-busy="true" className={style.root}>
    <img alt="Loader" className={style.image} src="react/assets/spinner.gif" />
  </div>
);

export default LoaderComponent;