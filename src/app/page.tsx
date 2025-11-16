'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, Medication, Settings } from '@/lib/db';
import { notificationManager } from '@/lib/notifications';
import { getNextScheduledTime, formatTime } from '@/lib/utils';
import { Plus, Clock, History, Settings as SettingsIcon, Users, Bell } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextMedication, setNextMedication] = useState<{ med: Medication; time: string } | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await db.init();
      const [meds, config] = await Promise.all([
        db.getAllMedications(),
        db.getSettings(),
      ]);
      
      setMedications(meds);
      setSettings(config);

      // Solicitar permissão para notificações
      await notificationManager.requestPermission();

      // Encontrar próximo medicamento
      findNextMedication(meds);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      setLoading(false);
    }
  };

  const findNextMedication = (meds: Medication[]) => {
    const now = new Date();
    let closest: { med: Medication; time: string; diff: number } | null = null;

    meds.forEach(med => {
      const nextTime = getNextScheduledTime(med.schedules);
      if (!nextTime) return;

      const [hours, minutes] = nextTime.split(':').map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const diff = scheduledDate.getTime() - now.getTime();

      if (!closest || diff < closest.diff) {
        closest = { med, time: nextTime, diff };
      }
    });

    if (closest) {
      setNextMedication({ med: closest.med, time: closest.time });
    }
  };

  const getFontSizeClass = () => {
    if (!settings) return 'text-base';
    switch (settings.fontSize) {
      case 'large': return 'text-lg';
      case 'extra-large': return 'text-2xl';
      default: return 'text-base';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-3xl font-bold text-blue-900">Carregando MedicFácil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 ${settings?.highContrast ? 'contrast-150' : ''}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-blue-900 mb-2">💊 MedicFácil</h1>
              <p className={`${getFontSizeClass()} text-gray-600 font-medium`}>
                Controle seus medicamentos
              </p>
            </div>
            <button
              onClick={() => router.push('/configuracoes')}
              className="p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all"
            >
              <SettingsIcon className="w-8 h-8 text-gray-700" />
            </button>
          </div>

          {/* Próximo Medicamento */}
          {nextMedication && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-8 h-8" />
                <p className="text-xl font-bold">Próximo Medicamento</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black mb-1">{nextMedication.med.name}</p>
                  <p className="text-xl opacity-90">{nextMedication.med.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl opacity-90 mb-1">às</p>
                  <p className="text-4xl font-black">{nextMedication.time}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => router.push('/adicionar')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-3xl p-8 shadow-2xl transition-all transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-16 h-16 mx-auto mb-4" />
            <p className="text-3xl font-black">Adicionar Remédio</p>
          </button>

          <button
            onClick={() => router.push('/tomar-agora')}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-3xl p-8 shadow-2xl transition-all transform hover:scale-105 active:scale-95"
          >
            <Clock className="w-16 h-16 mx-auto mb-4" />
            <p className="text-3xl font-black">Tomar Agora</p>
          </button>
        </div>

        {/* Meus Medicamentos */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Meus Medicamentos</h2>
          
          {medications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">💊</div>
              <p className="text-2xl text-gray-500 font-medium">Nenhum medicamento cadastrado</p>
              <p className="text-xl text-gray-400 mt-2">Clique em "Adicionar Remédio" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {medications.map((med) => (
                <button
                  key={med.id}
                  onClick={() => router.push(`/medicamento/${med.id}`)}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl p-6 transition-all text-left border-4 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center gap-4">
                    {med.photo ? (
                      <img src={med.photo} alt={med.name} className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
                        style={{ backgroundColor: med.color }}
                      >
                        💊
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-1">{med.name}</h3>
                      <p className="text-xl text-gray-600">{med.dosage}</p>
                      <p className="text-lg text-gray-500 mt-1">{med.frequency}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Próximo</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {getNextScheduledTime(med.schedules)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botões Secundários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/historico')}
            className="bg-white hover:bg-gray-50 rounded-3xl p-6 shadow-xl transition-all border-4 border-transparent hover:border-purple-500"
          >
            <History className="w-12 h-12 mx-auto mb-3 text-purple-600" />
            <p className="text-2xl font-black text-gray-900">Histórico</p>
          </button>

          <button
            onClick={() => router.push('/familia')}
            className="bg-white hover:bg-gray-50 rounded-3xl p-6 shadow-xl transition-all border-4 border-transparent hover:border-pink-500"
          >
            <Users className="w-12 h-12 mx-auto mb-3 text-pink-600" />
            <p className="text-2xl font-black text-gray-900">Família</p>
          </button>
        </div>
      </div>
    </div>
  );
}
