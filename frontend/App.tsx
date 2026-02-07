import React from 'react';
import Layout from './components/Layout';

const App: React.FC = () => {
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
    </Layout>
  );
};

export default App;