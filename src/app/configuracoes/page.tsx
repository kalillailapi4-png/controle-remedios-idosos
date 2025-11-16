'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, Settings } from '@/lib/db';
import { ArrowLeft, Volume2, Eye, Bell, Shield, Cloud, Zap } from 'lucide-react';

export default function Configuracoes() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await db.init();
      const config = await db.getSettings();
      setSettings(config);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;

    const updated = { ...settings, [key]: value };
    setSettings(updated);

    try {
      await db.saveSettings(updated);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const testVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta leitura em voz alta.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance('Teste de leitura em voz alta. Hora de tomar o remédio.');
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-3xl font-bold text-blue-900">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 ${settings.highContrast ? 'contrast-150' : ''}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-4 bg-white hover:bg-gray-100 rounded-2xl shadow-lg transition-all"
          >
            <ArrowLeft className="w-8 h-8 text-gray-700" />
          </button>
          <h1 className="text-4xl font-black text-blue-900">Configurações</h1>
        </div>

        {/* Tamanho da Fonte */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-black text-gray-900">Tamanho da Fonte</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: 'normal', label: 'Normal', size: 'text-xl' },
              { value: 'large', label: 'Grande', size: 'text-2xl' },
              { value: 'extra-large', label: 'Muito Grande', size: 'text-3xl' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateSetting('fontSize', option.value as Settings['fontSize'])}
                className={`p-6 rounded-2xl font-bold transition-all ${
                  settings.fontSize === option.value
                    ? 'bg-blue-500 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${option.size}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alto Contraste */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-600" />
              <div>
                <h2 className="text-3xl font-black text-gray-900">Alto Contraste</h2>
                <p className="text-xl text-gray-600 mt-1">Aumenta o contraste das cores</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('highContrast', !settings.highContrast)}
              className={`w-24 h-12 rounded-full transition-all ${
                settings.highContrast ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-10 h-10 bg-white rounded-full transition-all ${
                settings.highContrast ? 'ml-12' : 'ml-1'
              }`}></div>
            </button>
          </div>
        </div>

        {/* Som */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-3xl font-black text-gray-900">Som de Alerta</h2>
                <p className="text-xl text-gray-600 mt-1">Tocar som nas notificações</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              className={`w-24 h-12 rounded-full transition-all ${
                settings.soundEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-10 h-10 bg-white rounded-full transition-all ${
                settings.soundEnabled ? 'ml-12' : 'ml-1'
              }`}></div>
            </button>
          </div>
        </div>

        {/* Voz */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-3xl font-black text-gray-900">Leitura em Voz Alta</h2>
                <p className="text-xl text-gray-600 mt-1">Ler nome do remédio em voz alta</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
              className={`w-24 h-12 rounded-full transition-all ${
                settings.voiceEnabled ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-10 h-10 bg-white rounded-full transition-all ${
                settings.voiceEnabled ? 'ml-12' : 'ml-1'
              }`}></div>
            </button>
          </div>
          <button
            onClick={testVoice}
            className="w-full p-4 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xl font-bold rounded-2xl transition-all"
          >
            Testar Voz
          </button>
        </div>

        {/* Vibração */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-orange-600" />
              <div>
                <h2 className="text-3xl font-black text-gray-900">Vibração</h2>
                <p className="text-xl text-gray-600 mt-1">Vibrar ao notificar</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
              className={`w-24 h-12 rounded-full transition-all ${
                settings.vibrationEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-10 h-10 bg-white rounded-full transition-all ${
                settings.vibrationEnabled ? 'ml-12' : 'ml-1'
              }`}></div>
            </button>
          </div>
        </div>

        {/* Intervalo de Lembrete */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-black text-gray-900">Intervalo de Lembrete</h2>
          </div>
          <p className="text-xl text-gray-600 mb-4">Repetir alerta a cada:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[3, 5, 10, 15].map((minutes) => (
              <button
                key={minutes}
                onClick={() => updateSetting('reminderInterval', minutes)}
                className={`p-6 rounded-2xl text-2xl font-bold transition-all ${
                  settings.reminderInterval === minutes
                    ? 'bg-red-500 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        {/* PIN de Segurança */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-black text-gray-900">PIN de Segurança</h2>
          </div>
          <p className="text-xl text-gray-600 mb-4">Proteger configurações com PIN</p>
          <input
            type="password"
            value={settings.pin || ''}
            onChange={(e) => updateSetting('pin', e.target.value)}
            placeholder="Digite um PIN (4 dígitos)"
            maxLength={4}
            className="w-full text-3xl p-6 border-4 border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-center tracking-widest"
          />
        </div>

        {/* Backup na Nuvem */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="w-8 h-8 text-cyan-600" />
              <div>
                <h2 className="text-3xl font-black text-gray-900">Backup na Nuvem</h2>
                <p className="text-xl text-gray-600 mt-1">Sincronizar dados automaticamente</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('backupEnabled', !settings.backupEnabled)}
              className={`w-24 h-12 rounded-full transition-all ${
                settings.backupEnabled ? 'bg-cyan-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-10 h-10 bg-white rounded-full transition-all ${
                settings.backupEnabled ? 'ml-12' : 'ml-1'
              }`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
