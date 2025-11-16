'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, Medication, MedicationLog } from '@/lib/db';
import { generateId, getNextScheduledTime } from '@/lib/utils';
import { ArrowLeft, Check, Clock, Volume2 } from 'lucide-react';

export default function TomarAgora() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      await db.init();
      const meds = await db.getAllMedications();
      
      // Filtrar medicamentos que devem ser tomados agora (próxima hora)
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const upcomingMeds = meds.filter(med => {
        const nextTime = getNextScheduledTime(med.schedules);
        if (!nextTime) return false;
        
        const [hours, minutes] = nextTime.split(':').map(Number);
        const timeDiff = (hours * 60 + minutes) - (currentHour * 60 + currentMinute);
        
        // Mostrar medicamentos que devem ser tomados nos próximos 30 minutos ou que já passaram da hora
        return timeDiff <= 30 && timeDiff >= -30;
      });

      setMedications(upcomingMeds);
      if (upcomingMeds.length > 0) {
        setCurrentMedication(upcomingMeds[0]);
        speakMedication(upcomingMeds[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
      setLoading(false);
    }
  };

  const speakMedication = (medication: Medication) => {
    if (!('speechSynthesis' in window)) return;

    const text = `Atenção! Hora de tomar o remédio ${medication.name}. Dosagem: ${medication.dosage}. ${medication.instructions || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  const handleTaken = async () => {
    if (!currentMedication) return;

    try {
      const log: MedicationLog = {
        id: generateId(),
        medicationId: currentMedication.id,
        scheduledTime: new Date().toISOString(),
        takenAt: new Date().toISOString(),
        status: 'taken',
        createdAt: new Date().toISOString(),
      };

      await db.addLog(log);

      // Próximo medicamento ou voltar
      const currentIndex = medications.findIndex(m => m.id === currentMedication.id);
      if (currentIndex < medications.length - 1) {
        const nextMed = medications[currentIndex + 1];
        setCurrentMedication(nextMed);
        speakMedication(nextMed);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Erro ao registrar medicamento:', error);
      alert('Erro ao registrar. Tente novamente.');
    }
  };

  const handleRemindLater = async () => {
    if (!currentMedication) return;

    try {
      const log: MedicationLog = {
        id: generateId(),
        medicationId: currentMedication.id,
        scheduledTime: new Date().toISOString(),
        status: 'delayed',
        createdAt: new Date().toISOString(),
      };

      await db.addLog(log);

      // Agendar lembrete para 5 minutos
      setTimeout(() => {
        speakMedication(currentMedication);
      }, 5 * 60 * 1000);

      router.push('/');
    } catch (error) {
      console.error('Erro ao adiar:', error);
      alert('Erro ao adiar. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-3xl font-bold text-orange-900">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentMedication || medications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/')}
              className="p-4 bg-white hover:bg-gray-100 rounded-2xl shadow-lg transition-all"
            >
              <ArrowLeft className="w-8 h-8 text-gray-700" />
            </button>
            <h1 className="text-4xl font-black text-orange-900">Tomar Agora</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-8xl mb-6">✅</div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Nenhum medicamento agendado</h2>
            <p className="text-2xl text-gray-600">Você está em dia com seus medicamentos!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-4 bg-white hover:bg-gray-100 rounded-2xl shadow-lg transition-all"
          >
            <ArrowLeft className="w-8 h-8 text-gray-700" />
          </button>
          <h1 className="text-4xl font-black text-orange-900">Hora do Remédio!</h1>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 mb-6">
          {/* Foto/Cor */}
          <div className="flex justify-center mb-8">
            {currentMedication.photo ? (
              <img 
                src={currentMedication.photo} 
                alt={currentMedication.name} 
                className="w-64 h-64 rounded-3xl object-cover shadow-2xl"
              />
            ) : (
              <div 
                className="w-64 h-64 rounded-3xl flex items-center justify-center text-9xl shadow-2xl"
                style={{ backgroundColor: currentMedication.color }}
              >
                💊
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-black text-gray-900 mb-4">{currentMedication.name}</h2>
            <p className="text-3xl text-gray-700 mb-2">{currentMedication.dosage}</p>
            <p className="text-2xl text-gray-600">{currentMedication.frequency}</p>
            
            {currentMedication.instructions && (
              <div className="mt-6 p-6 bg-blue-50 rounded-2xl">
                <p className="text-xl text-blue-900 font-medium">{currentMedication.instructions}</p>
              </div>
            )}
          </div>

          {/* Botão Ouvir */}
          <button
            onClick={() => speakMedication(currentMedication)}
            className="w-full mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-2xl font-bold p-6 rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="flex items-center justify-center gap-3">
              <Volume2 className="w-8 h-8" />
              Ouvir Novamente
            </div>
          </button>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleTaken}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-3xl font-black p-8 rounded-3xl shadow-2xl transition-all transform hover:scale-105 active:scale-95"
            >
              <Check className="w-12 h-12 mx-auto mb-3" />
              TOMEI
            </button>

            <button
              onClick={handleRemindLater}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-2xl font-black p-8 rounded-3xl shadow-2xl transition-all transform hover:scale-105 active:scale-95"
            >
              <Clock className="w-10 h-10 mx-auto mb-3" />
              Lembrar Depois
            </button>
          </div>
        </div>

        {/* Próximos Medicamentos */}
        {medications.length > 1 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h3 className="text-2xl font-black text-gray-900 mb-4">Próximos Medicamentos</h3>
            <div className="space-y-3">
              {medications.slice(1).map((med) => (
                <div key={med.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: med.color }}
                  >
                    💊
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-gray-900">{med.name}</p>
                    <p className="text-lg text-gray-600">{med.dosage}</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {getNextScheduledTime(med.schedules)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
