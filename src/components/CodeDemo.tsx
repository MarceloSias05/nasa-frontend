import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar/Sidebar';
import MainView from './MainView';

const CodeDemo: React.FC = () => {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
    <Sidebar
      active={''}
      onSelect={() => {}}
      layer={''}
      onLayerChange={() => {}}
      cellSize={0}
      onCellSizeChange={() => {}}
      clusterRadius={0}
      onClusterRadiusChange={() => {}}
      maxHeight={0}
      onMaxHeightChange={() => {}}
      budget={0}
      onBudgetChange={() => {}}
      maxParques={0}
      onMaxParquesChange={() => {}}
      maxEscuelas={10}
      onMaxEscuelasChange={() => {}}
      hexRadius={150}
      onHexRadiusChange={() => {}}
      hexElevationScale={1200}
      onHexElevationScaleChange={() => {}}
    />
        <MainView />
      </div>
    </div>
  );
};

export default CodeDemo;
