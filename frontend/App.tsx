import React, { useState } from 'react';
import Layout from './components/Layout';
import HomeView from './components/HomeView';

export type AppView = 'home' | 'scanner' | 'about' | 'login' | 'signup';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const handleNavigate = (view: AppView | 'chat', e?: React.MouseEvent) => {
    if (view === 'chat') return;
    setCurrentView(view as AppView);
  };

  return (
    <Layout>
      <HomeView onNavigate={handleNavigate} />
    </Layout>
  );
};

export default App;
