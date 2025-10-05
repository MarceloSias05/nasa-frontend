import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar/Sidebar';
import MainView from './MainView';

const CodeDemo: React.FC = () => {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={''} onSelect={function (key: string): void {
                  throw new Error('Function not implemented.');
              } } layer={''} onLayerChange={function (value: string): void {
                  throw new Error('Function not implemented.');
              } } cellSize={0} onCellSizeChange={function (value: number): void {
                  throw new Error('Function not implemented.');
              } } clusterRadius={0} onClusterRadiusChange={function (value: number): void {
                  throw new Error('Function not implemented.');
              } } maxHeight={0} onMaxHeightChange={function (value: number): void {
                  throw new Error('Function not implemented.');
              } } />
        <MainView />
      </div>
    </div>
  );
};

export default CodeDemo;
