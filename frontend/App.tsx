import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AboutView from './components/AboutView';
import AuthView from './components/AuthView';
import HomeView from './components/HomeView';
import RecycleView from './components/RecycleView';
import RecycleMapView from './components/RecycleMapView';
import { checkSession, User } from './services/authService';

export type AppView = 'home' | 'scanner' | 'about' | 'login' | 'signup' | 'map';

interface MapData {
  analysisData: any;
  location: { lat: number; lng: number };
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession().then((userData) => {
      setUser(userData);
      setSessionLoading(false);
    });
  }, []);
  
  const handleNavigate = (view: AppView | 'chat', e?: React.MouseEvent) => {
    if (view === 'chat') return;
    setCurrentView(view as AppView);
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleShowMap = (analysisData: any, location: { lat: number; lng: number }) => {
    setMapData({ analysisData, location });
    setCurrentView('map');
  };

  if (sessionLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-green-400 font-mono text-sm animate-pulse">Loading session...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {currentView === 'about' ? (
        <AboutView onBack={() => setCurrentView('home')} />
      ) : currentView === 'login' || currentView === 'signup' ? (
        <AuthView mode={currentView} onBack={() => setCurrentView('home')} onAuthSuccess={handleAuthSuccess} />
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
        <HomeView onNavigate={handleNavigate} user={user} onLogout={handleLogout} />
      )}
    </Layout>
  );
};

export default App;
