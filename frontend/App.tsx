import React, { useState } from 'react';
import Layout from './components/Layout';
import AboutView from './components/AboutView';
import AuthView from './components/AuthView';
import HomeView from './components/HomeView';
import RecycleView from './components/RecycleView';

export type AppView = 'home' | 'scanner' | 'about' | 'login' | 'signup';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const handleNavigate = (view: AppView | 'chat', e?: React.MouseEvent) => {
    if (view === 'chat') return;
    setCurrentView(view as AppView);
  };

  return (
    <Layout>
      {currentView === 'about' ? (
        <AboutView onBack={() => setCurrentView('home')} />
      ) : currentView === 'login' || currentView === 'signup' ? (
        <AuthView mode={currentView} onBack={() => setCurrentView('home')} />
      ) : currentView === 'scanner' ? (
        <RecycleView onBack={() => setCurrentView('home')} />
      ) : (
        <HomeView onNavigate={handleNavigate} />
      )}
    </Layout>
  );
};

export default App;
