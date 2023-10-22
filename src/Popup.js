import React from 'react';

function Popup(props) {
  return (
    <div className="popup" style={{ display: props.visible ? 'flex' : 'none' }}>
      <div className="popup-content">
        {props.children}
      </div>
    </div>
  );
}

export default Popup;