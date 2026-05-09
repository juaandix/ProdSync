import React from 'react';

interface ContentLayoutProps {
  children: React.ReactNode;
}

const ContentLayout: React.FC<ContentLayoutProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6 w-full">
      <div className="col-span-12">
        {children}
      </div>
    </div>
  );
};

export default ContentLayout;
