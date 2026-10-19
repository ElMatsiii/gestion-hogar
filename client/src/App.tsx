import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ExecutiveSummary } from './components/summary/ExecutiveSummary';
import { FinanceDashboard } from './components/finances/FinanceDashboard';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { ShoppingDashboard } from './components/shopping/ShoppingDashboard';
import { CloudSetupGuide } from './components/cloud/CloudSetupGuide';
import {
  FinancialSummaryDTO,
  Member,
  Expense,
  Subscription,
  InventoryItem,
  ShoppingItem,
} from './types';
import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          console.warn('Backend not responding yet, error:', e);
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
        {/* Error notification if backend offline */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex justify-between items-center">
            <span>
              ℹ️ El servidor backend no está respondiendo todavía. Puedes iniciarlo con <code>npm run dev</code> en la carpeta raíz.
            </span>
            <button
              onClick={() => loadData(true)}
              className="px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg text-xs font-bold"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Refresh indicator */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
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

        {activeTab === 'cloud' && <CloudSetupGuide />}
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
