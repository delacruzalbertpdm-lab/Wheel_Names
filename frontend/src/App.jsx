import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PulseDrawProvider } from './context/PulseDrawContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import SelectionArenaPage from './pages/SelectionArenaPage';
import ParticipantsPage from './pages/ParticipantsPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <PulseDrawProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/arena" element={<SelectionArenaPage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </PulseDrawProvider>
    </BrowserRouter>
  );
}

