import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { UserProvider } from './context/UserContext';
import { ReportProvider } from './context/ReportContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <VehicleProvider>
          <UserProvider>
            <ReportProvider>
              <App />
            </ReportProvider>
          </UserProvider>
        </VehicleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
