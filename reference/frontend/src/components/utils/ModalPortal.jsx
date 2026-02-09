import { createPortal } from 'react-dom';

const ModalPortal = ({ children }) => {
  // This takes the "children" (your popup) and renders them 
  // directly onto the document.body, outside of your AdminLayout
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Enable pointer events for the actual modal content */}
      <div className="pointer-events-auto w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default ModalPortal;