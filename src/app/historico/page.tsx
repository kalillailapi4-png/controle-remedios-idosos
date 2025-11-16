'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, MedicationLog, Medication } from '@/lib/db';
import { formatDate, formatTime } from '@/lib/utils';
import { ArrowLeft, Calendar, Check, X, Clock, Download } from 'lucide-react';

export default function Historico() {
  const router = useRouter();
  const [logs, setLogs] = useState<(MedicationLog & { medication?: Medication })[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  const loadHistory = async () => {
    try {
      await db.init();
      const [allLogs, allMeds] = await Promise.all([
        db.getLogsByDate(selectedDate),
        db.getAllMedications(),
      ]);

      // Associar medicamentos aos logs
      const logsWithMeds = allLogs.map(log => ({
        ...log,
        medication: allMeds.find(m => m.id === log.medicationId),
      }));

      setLogs(logsWithMeds);
      setMedications(allMeds);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setLoading(false);
    }
  };

  const getStatusInfo = (status: MedicationLog['status']) => {
    switch (status) {
      case 'taken':
        return { icon: <Check className="w-6 h-6" />, color: 'bg-green-500', text: 'Tomado' };
      case 'skipped':
        return { icon: <X className="w-6 h-6" />, color: 'bg-red-500', text: 'Pulado' };
      case 'delayed':
        return { icon: <Clock className="w-6 h-6" />, color: 'bg-orange-500', text: 'Adiado' };
      default:
        return { icon: <Clock className="w-6 h-6" />, color: 'bg-gray-500', text: 'Pendente' };
    }
  };

  const exportToPDF = () => {
    // Simulação de exportação (em produção, usar biblioteca como jsPDF)
    const content = logs.map(log => {
      const status = getStatusInfo(log.status);
      return `${formatTime(new Date(log.scheduledTime))} - ${log.medication?.name} (${log.medication?.dosage}) - ${status.text}`;
    }).join('\n');

    const blob = new Blob([`Histórico de Medicamentos - ${formatDate(new Date(selectedDate))}\n\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-${selectedDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-3xl font-bold text-purple-900">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-4 bg-white hover:bg-gray-100 rounded-2xl shadow-lg transition-all"
          >
            <ArrowLeft className="w-8 h-8 text-gray-700" />
          </button>
          <h1 className="text-4xl font-black text-purple-900">Histórico</h1>
        </div>

        {/* Seletor de Data */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-8 h-8 text-purple-600" />
            <label className="text-2xl font-bold text-gray-900">Selecionar Data</label>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-2xl p-6 border-4 border-gray-300 rounded-2xl focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Estatísticas do Dia */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
            <p className="text-4xl font-black text-gray-900 mb-2">{logs.length}</p>
            <p className="text-lg text-gray-600">Total</p>
          </div>
          <div className="bg-green-500 rounded-2xl shadow-xl p-6 text-center text-white">
            <p className="text-4xl font-black mb-2">{logs.filter(l => l.status === 'taken').length}</p>
            <p className="text-lg">Tomados</p>
          </div>
          <div className="bg-orange-500 rounded-2xl shadow-xl p-6 text-center text-white">
            <p className="text-4xl font-black mb-2">{logs.filter(l => l.status === 'delayed').length}</p>
            <p className="text-lg">Adiados</p>
          </div>
          <div className="bg-red-500 rounded-2xl shadow-xl p-6 text-center text-white">
            <p className="text-4xl font-black mb-2">{logs.filter(l => l.status === 'skipped').length}</p>
            <p className="text-lg">Pulados</p>
          </div>
        </div>

        {/* Lista de Logs */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-gray-900">Registros</h2>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white text-lg font-bold rounded-xl transition-all"
            >
              <Download className="w-5 h-5" />
              Exportar
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">📋</div>
              <p className="text-2xl text-gray-500 font-medium">Nenhum registro nesta data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const status = getStatusInfo(log.status);
                return (
                  <div key={log.id} className="flex items-center gap-4 p-6 bg-gray-50 rounded-2xl">
                    <div className={`${status.color} text-white p-4 rounded-xl`}>
                      {status.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900">{log.medication?.name}</h3>
                      <p className="text-xl text-gray-600">{log.medication?.dosage}</p>
                      <p className="text-lg text-gray-500 mt-1">
                        Agendado: {formatTime(new Date(log.scheduledTime))}
                        {log.takenAt && ` • Tomado: ${formatTime(new Date(log.takenAt))}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`${status.color} text-white px-4 py-2 rounded-xl text-lg font-bold`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo Geral */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Resumo Geral</h2>
          <div className="space-y-4">
            {medications.map((med) => {
              const medLogs = logs.filter(l => l.medicationId === med.id);
              const taken = medLogs.filter(l => l.status === 'taken').length;
              const total = medLogs.length;
              const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

              return (
                <div key={med.id} className="p-6 bg-gray-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-black text-gray-900">{med.name}</h3>
                    <span className="text-2xl font-bold text-purple-600">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-4 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-lg text-gray-600 mt-2">{taken} de {total} doses tomadas</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
