import { useCallback, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';
import { AgentsPage } from './pages/AgentsPage';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { GetStartedPage } from './pages/GetStartedPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommandPalette } from './components/CommandPalette';
import { Layout } from './components/Layout';
import { SetupScreen } from './components/SetupScreen';
import { Toaster } from './components/ui/sonner';
import {
  fetchModels,
  fetchSavings,
  fetchServerInfo,
  isTauri,
} from './lib/api';
import { useAppStore } from './lib/store';

export default function App() {
  const [setupDone, setSetupDone] = useState(!isTauri());
  const handleSetupReady = useCallback(() => {
    setSetupDone(true);
    // Local marker only. The ZAREK build does not emit setup telemetry.
    localStorage.setItem('oj-setup-completed', '1');
  }, []);

  const setModels = useAppStore((state) => state.setModels);
  const setModelsLoading = useAppStore((state) => state.setModelsLoading);
  const setServerInfo = useAppStore((state) => state.setServerInfo);
  const setSavings = useAppStore((state) => state.setSavings);
  const settings = useAppStore((state) => state.settings);
  const commandPaletteOpen = useAppStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const toggleSystemPanel = useAppStore((state) => state.toggleSystemPanel);
  const importOverlay = useAppStore((state) => state.importOverlayConversation);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (settings.theme === 'light') root.classList.add('light');
    else root.classList.add('dark');
  }, [settings.theme]);

  useEffect(() => {
    if (!isTauri()) return;
    importOverlay();
    const interval = setInterval(importOverlay, 5000);
    return () => clearInterval(interval);
  }, [importOverlay]);

  useEffect(() => {
    if (!setupDone) return;
    let cancelled = false;
    setModelsLoading(true);
    fetchModels()
      .then((models) => {
        if (!cancelled) {
          setModels(models);
          if (!localStorage.getItem('zarek-primary-model-initialized')) {
            const preferred = models.find((model) => model.id === 'qwen3.5:4b');
            if (preferred) useAppStore.getState().setSelectedModel(preferred.id);
            localStorage.setItem('zarek-primary-model-initialized', '1');
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setupDone, setModels, setModelsLoading]);

  useEffect(() => {
    if (!setupDone) return;
    fetchServerInfo().then(setServerInfo).catch(() => {});
  }, [setupDone, setServerInfo]);

  useEffect(() => {
    if (!setupDone) return;
    // Cost and energy estimates remain local; no leaderboard submission exists
    // in the ZAREK runtime path.
    const refresh = () => fetchSavings().then(setSavings).catch(() => {});
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [setupDone, setSavings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault();
        toggleSystemPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen, toggleSystemPanel]);

  if (!setupDone) return <SetupScreen onReady={handleSetupReady} />;

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="get-started" element={<GetStartedPage />} />
          <Route path="data-sources" element={<DataSourcesPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="logs" element={<LogsPage />} />
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
      {commandPaletteOpen && <CommandPalette />}
    </>
  );
}
