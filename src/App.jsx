import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './hooks/useApp';
import Navbar from './components/Navbar';
import QuickFoodModal from './components/QuickFoodModal';
import LoginPage from './pages/Auth/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Routine from './pages/Routine/Routine';
import FoodScanner from './pages/FoodScanner/FoodScanner';
import FoodDiary from './pages/FoodDiary/FoodDiary';
import History from './pages/History/History';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

import { isFirebaseConfigured } from './services/firebase/firebaseConfig';

function AppShell() {
  const { user, activeTab } = useApp();
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [outsideMode, setOutsideMode] = useState(false);

  const firebaseReady = isFirebaseConfigured();
  const isSessionValid =
    Boolean(user) &&
    (!firebaseReady || !user.isLocalOnly) &&
    (!user.sessionExpiresAt || Date.now() <= Number(user.sessionExpiresAt));

  if (!isSessionValid) {
    return <LoginPage />;
  }

  const handleOpenFoodModal = () => {
    setOutsideMode(false);
    setFoodModalOpen(true);
  };

  const handleOpenOutsideFoodModal = () => {
    setOutsideMode(true);
    setFoodModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-crown-bg text-crown-text flex flex-col">
      <Navbar onOpenOutsideFoodModal={handleOpenOutsideFoodModal} />

      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 py-5">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenFoodModal={handleOpenFoodModal}
              onOpenOutsideFoodModal={handleOpenOutsideFoodModal}
            />
          )}
          {activeTab === 'routine' && <Routine />}
          {activeTab === 'scanner' && <FoodScanner />}
          {activeTab === 'diary' && <FoodDiary />}
          {activeTab === 'history' && <History />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>

      <QuickFoodModal
        isOpen={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        defaultOutside={outsideMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
