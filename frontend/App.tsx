import React, { useState } from 'react';
import Layout from './components/Layout';
import AboutView from './components/AboutView';
import AuthView from './components/AuthView';
import HomeView from './components/HomeView';
import RecycleView from './components/RecycleView';
import RecycleMapView from './components/RecycleMapView';

export type AppView = 'home' | 'scanner' | 'about' | 'login' | 'signup' | 'map';

interface MapData {
  analysisData: any;
  location: { lat: number; lng: number };
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [mapData, setMapData] = useState<MapData | null>(null);
  
  const handleNavigate = (view: AppView | 'chat', e?: React.MouseEvent) => {
    if (view === 'chat') return;
    setCurrentView(view as AppView);
  };

  const handleShowMap = (analysisData: any, location: { lat: number; lng: number }) => {
    setMapData({ analysisData, location });
    setCurrentView('map');
  };

  return (
    <Layout>
      {currentView === 'about' ? (
        <AboutView onBack={() => setCurrentView('home')} />
      ) : currentView === 'login' || currentView === 'signup' ? (
        <AuthView mode={currentView} onBack={() => setCurrentView('home')} />
      ) : currentView === 'map' && mapData ? (
        <RecycleMapView 
          onBack={() => setCurrentView('scanner')} 
          analysisData={mapData.analysisData}
          location={mapData.location}
        />
      ) : currentView === 'scanner' ? (
        <RecycleView 
          onBack={() => setCurrentView('home')} 
          onShowMap={handleShowMap}
        />
      ) : (
        <HomeView onNavigate={handleNavigate} />
      )}
    </Layout>
  );
};

export default App;
