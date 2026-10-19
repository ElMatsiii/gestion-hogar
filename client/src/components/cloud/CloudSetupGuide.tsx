import React, { useState } from 'react';
import {
  Cloud,
  Database,
  Server,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react';

export const CloudSetupGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const gitCommands = `# 1. En la raíz del proyecto (C:\\gestion-hogar):
git remote add origin https://github.com/TU_USUARIO_GITHUB/gestion-hogar.git
git branch -M main
git push -u origin main`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold mb-3 border border-sky-200">
          <Cloud className="w-4 h-4 text-sky-600" />
          Recomendación de Infraestructura y Nube
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Persistencia 24/7 en la Nube y Hosting Recomendado
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Para una familia de hasta 10 personas, no es necesario pagar por servidores dedicados costosos. Las siguientes soluciones ofrecen disponibilidad del 99.9% las 24 horas del día de forma 100% gratuita o de costo casi nulo.
        </p>
      </div>

      {/* Cloud Database Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommendation #1: Supabase */}
        <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Recomendada #1
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Supabase (PostgreSQL)</h3>
              <span className="text-xs text-emerald-600 font-bold">Gratis para siempre</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Es la opción perfecta para este proyecto. Proporciona una base de datos PostgreSQL completa en la nube de alta velocidad con 500 MB de almacenamiento (suficiente para años de registros familiares) y hasta 50.000 usuarios activos al mes.
          </p>

          <ul className="space-y-2 text-xs text-slate-700 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Sincronización en tiempo real:</strong> Si alguien compra leche en el super, se actualiza al instante en los celulares de todos.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Backups automáticos en la nube:</strong> Tus datos de finanzas nunca se perderán si se apaga tu PC.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span><strong>Script SQL listo:</strong> Ya incluimos el archivo <code>schema.sql</code> para crear las tablas con un solo click.</span>
            </li>
          </ul>

          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <span>Crear cuenta gratis en Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Alternative: Neon Postgres */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Neon Serverless Postgres</h3>
                <span className="text-xs text-slate-500 font-bold">Alternativa Serverless</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Base de datos PostgreSQL serverless optimizada para aplicaciones Node.js. No requiere configuración y cuenta con plan gratuito generoso con 0.5 GB de almacenamiento y ramas de prueba.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Compatible con cualquier cliente standard de PostgreSQL.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Auto-escalado y suspensión cuando no hay uso para ahorrar recursos.</span>
              </li>
            </ul>
          </div>

          <a
            href="https://neon.tech"
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <span>Conocer Neon.tech</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Hosting Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-600" />
          Dónde Hostear la Aplicación Web (Frontend y Backend)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 text-sm mb-1">Frontend (React + Tailwind): Vercel</div>
            <p className="text-slate-600 mb-2">
              Conecta tu repositorio de GitHub a <strong>Vercel</strong> o <strong>Cloudflare Pages</strong>. Cada vez que hagas un <code>git push</code>, se desplegará automáticamente con dominio HTTPS gratuito (ej: <code>mi-hogar.vercel.app</code>) para que cualquier persona de la casa entre desde su celular.
            </p>
            <span className="font-semibold text-emerald-600">Costo: $0 USD</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 text-sm mb-1">Backend (Node.js API): Render o Railway</div>
            <p className="text-slate-600 mb-2">
              Puedes desplegar la carpeta <code>/server</code> en <strong>Render.com</strong> (Web Service gratuito) o <strong>Railway.app</strong>. Mantiene la API activa para responder peticiones desde cualquier lugar.
            </p>
            <span className="font-semibold text-emerald-600">Costo: $0 USD (Plan Free)</span>
          </div>
        </div>
      </div>

      {/* Git Repository Instructions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-400" />
            Conectar con tu Repositorio de GitHub
          </h3>
          <button
            onClick={() => copyToClipboard(gitCommands)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? '¡Copiado!' : 'Copiar comandos'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          El proyecto ya cuenta con Git inicializado localmente en <code>C:\gestion-hogar</code> con todos los archivos guardados en el commit inicial. Para subirlo a tu cuenta de GitHub:
        </p>

        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 mb-4">
          <li>Crea un nuevo repositorio en tu cuenta de <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">GitHub.com/new</a> llamado <code>gestion-hogar</code>.</li>
          <li>Abre tu terminal en <code>C:\gestion-hogar</code> y ejecuta:</li>
        </ol>

        <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto border border-slate-800">
          {gitCommands}
        </pre>
      </div>
    </div>
  );
};
