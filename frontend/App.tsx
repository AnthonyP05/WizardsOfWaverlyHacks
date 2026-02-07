import React, { useState } from 'react';
import Layout from './components/Layout';
import FloatingChat from './components/FloatingChat';

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Layout>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: 'white'
        }}>
          WizardsOfWaverlyHacks
        </h1>
      </div>
      <FloatingChat isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </Layout>
  );
};

export default App;