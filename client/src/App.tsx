import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ExecutiveSummary } from './components/summary/ExecutiveSummary';
import { FinanceDashboard } from './components/finances/FinanceDashboard';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { ShoppingDashboard } from './components/shopping/ShoppingDashboard';
import {
  FinancialSummaryDTO,
  Member,
  Expense,
  Subscription,
  InventoryItem,
  ShoppingItem,
} from './types';
import { api, getStoredApiUrl, setCustomApiUrl, getApiBase } from './services/api';
import { RefreshCw, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNotification } from './context/NotificationContext';

export function App() {
  const { showSuccess, showError, showWarning } = useNotification();
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Backend connection state
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const [showConfig, setShowConfig] = useState<boolean>(() => {
    return isVercel && !getStoredApiUrl();
  });
  const [urlInput, setUrlInput] = useState(getStoredApiUrl());
  const [testingConnection, setTestingConnection] = useState(false);

  // Core Data State
  const [summary, setSummary] = useState<FinancialSummaryDTO | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    setError(null);
    try {
      const [sumData, memData, expData, subData, invData, shopData] = await Promise.all([
        api.getFinancialSummary().catch((e) => {
          console.warn('Backend no responde:', e);
          return null;
        }),
        api.getMembers().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getSubscriptions().catch(() => []),
        api.getInventoryItems().catch(() => []),
        api.getShoppingList().catch(() => []),
      ]);

      if (sumData) setSummary(sumData);
      setMembers(memData);
      setExpenses(expData);
      setSubscriptions(subData);
      setInventory(invData);
      setShopping(shopData);
    } catch (err: any) {
      setError(err.message || 'Error cargando datos del servidor');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnectBackend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      showWarning('Ingresa la URL de tu servicio en Render');
      return;
    }
    setTestingConnection(true);
    try {
      await api.checkHealth(urlInput);
      setCustomApiUrl(urlInput);
      setShowConfig(false);
      showSuccess('¡Conectado exitosamente con tu backend en Render!');
      loadData(true);
    } catch (err: any) {
      // Still allow saving if Render is waking up from sleep
      setCustomApiUrl(urlInput);
      showWarning('URL guardada. Si Render está en reposo, puede tardar ~30s en despertar.');
      setShowConfig(false);
      loadData(true);
    } finally {
      setTestingConnection(false);
    }
  };

  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const expiringCount = inventory.filter(
    (i) => i.expirationStatus === 'EXPIRING_SOON' || i.expirationStatus === 'EXPIRED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        remainingPool={summary?.remainingFamilyPool || 0}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Backend Configuration Banner for Vercel */}
        {(showConfig || (isVercel && getApiBase() === '/api')) && (
          <div className="mb-6 p-5 rounded-2xl bg-indigo-900 text-white shadow-lg border border-indigo-700 animate-in fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white/10 shrink-0">
                  <Server className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Conectar con tu Servidor Backend en Render
                  </h4>
                  <p className="text-xs text-indigo-200 mt-0.5 max-w-xl">
                    Pega la URL de tu backend en Render (ej. <code>https://gestion-hogar-backend.onrender.com</code>) para que la página pueda guardar y consultar los integrantes, gastos y alimentos.
                  </p>
                </div>
              </div>

              <form onSubmit={handleConnectBackend} className="flex w-full md:w-auto items-center gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://tu-backend.onrender.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="px-3 py-2 bg-indigo-950 border border-indigo-600 rounded-xl text-xs text-white placeholder-indigo-400 focus:outline-emerald-400 w-full md:w-72 font-mono"
                />
                <button
                  type="submit"
                  disabled={testingConnection}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
                >
                  {testingConnection ? 'Probando...' : 'Conectar'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Top bar controls */}
        <div className="flex justify-between items-center mb-4 text-xs">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span>
              Servidor API:{' '}
              <strong className="font-mono text-[11px] text-slate-700">
                {getStoredApiUrl() || (isVercel ? 'No conectado (Vercel local)' : 'Localhost:3001')}
              </strong>
            </span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRefreshing ? 'Actualizando datos...' : 'Actualizar'}</span>
          </button>
        </div>

        {/* Tab View */}
        {activeTab === 'summary' && (
          <ExecutiveSummary
            summary={summary}
            inventory={inventory}
            shopping={shopping}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'finances' && (
          <FinanceDashboard
            summary={summary}
            members={members}
            expenses={expenses}
            subscriptions={subscriptions}
            onRefresh={() => loadData(false)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryDashboard
            items={inventory}
            onRefresh={() => loadData(false)}
            onNavigateToShopping={() => setActiveTab('shopping')}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingDashboard items={shopping} onRefresh={() => loadData(false)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>HogarSync · Sistema de Finanzas Compartidas y Rotación de Despensa</p>
        <p className="mt-1">Arquitectura Limpia (Clean Architecture) · Principios SOLID · Node.js & React</p>
      </footer>
    </div>
  );
}

export default App;
