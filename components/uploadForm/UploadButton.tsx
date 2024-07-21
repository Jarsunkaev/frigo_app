import React from "react";

//create a button component 
const UploadButton = ({handleClick}) => {  
  return (
    <div>
      <button onClick={handleClick}>Upload</button>
    </div>
  );
}

export default UploadButton;