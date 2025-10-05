import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MainView from './MainView';

const CodeDemo: React.FC = () => {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainView />
      </div>
    </div>
  );
};

export default CodeDemo;
