import React from 'react';
import ReactDOM from 'react-dom/client';
import { OwlCallWidget } from '@agentstream/owl';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="page">
      <header className="topbar">
        <h1>agentstream</h1>
        <div className="topbar-actions">OWL v0 scaffold</div>
      </header>

      <main className="content">
        <OwlCallWidget />
      </main>
    </div>
  </React.StrictMode>
);
