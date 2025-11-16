'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, Medication } from '@/lib/db';
import { generateId, compressImage, medicationColors, medicationTypes, frequencyOptions } from '@/lib/utils';
import { Camera, ArrowLeft, Save, X } from 'lucide-react';

export default function AdicionarMedicamento() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    color: medicationColors[0].value,
    type: 'comprimido' as Medication['type'],
    dosage: '',
    schedules: ['08:00'],
    frequency: frequencyOptions[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    instructions: '',
  });

  const [saving, setSaving] = useState(false);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setFormData(prev => ({ ...prev, photo: compressed }));
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar imagem. Tente novamente.');
    }
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, '12:00']
    }));
  };

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const updateSchedule = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((s, i) => i === index ? value : s)
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.dosage) {
      alert('Por favor, preencha o nome e a dosagem do medicamento.');
      return;
    }

    if (formData.schedules.length === 0) {
      alert('Adicione pelo menos um horário.');
      return;
    }

    setSaving(true);

    try {
      const medication: Medication = {
        id: generateId(),
        name: formData.name,
        photo: formData.photo,
        color: formData.color,
        type: formData.type,
        dosage: formData.dosage,
        schedules: formData.schedules.sort(),
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        instructions: formData.instructions || undefined,
        createdAt: new Date().toISOString(),
      };

      await db.addMedication(medication);
      router.push('/');
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      alert('Erro ao salvar medicamento. Tente novamente.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-4 bg-white hover:bg-gray-100 rounded-2xl shadow-lg transition-all"
          >
            <ArrowLeft className="w-8 h-8 text-gray-700" />
          </button>
          <h1 className="text-4xl font-black text-blue-900">Adicionar Remédio</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {/* Foto */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Foto do Remédio</label>
            <div className="flex flex-col items-center gap-4">
              {formData.photo ? (
                <div className="relative">
                  <img src={formData.photo} alt="Medicamento" className="w-48 h-48 rounded-2xl object-cover" />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-48 h-48 bg-gradient-to-br from-blue-100 to-indigo-200 hover:from-blue-200 hover:to-indigo-300 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-4 border-dashed border-blue-400"
                >
                  <Camera className="w-16 h-16 text-blue-600" />
                  <p className="text-xl font-bold text-blue-900">Tirar Foto</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>
          </div>

          {/* Nome */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Nome do Medicamento</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Losartana"
              className="w-full text-2xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Cor */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Cor do Comprimido</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {medicationColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`h-20 rounded-2xl transition-all ${
                    formData.color === color.value ? 'ring-8 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ 
                    backgroundColor: color.value,
                    border: color.border ? `4px solid ${color.border}` : 'none'
                  }}
                >
                  <span className="text-xs font-bold text-gray-700">{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Tipo</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {medicationTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value as Medication['type'] }))}
                  className={`p-6 rounded-2xl text-xl font-bold transition-all ${
                    formData.type === type.value
                      ? 'bg-blue-500 text-white scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dosagem */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Dosagem</label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder="Ex: 50mg"
              className="w-full text-2xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Horários */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Horários</label>
            <div className="space-y-3">
              {formData.schedules.map((schedule, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="time"
                    value={schedule}
                    onChange={(e) => updateSchedule(index, e.target.value)}
                    className="flex-1 text-2xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none"
                  />
                  {formData.schedules.length > 1 && (
                    <button
                      onClick={() => removeSchedule(index)}
                      className="p-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addSchedule}
                className="w-full p-6 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-2xl transition-all"
              >
                + Adicionar Horário
              </button>
            </div>
          </div>

          {/* Frequência */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Frequência</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
              className="w-full text-2xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none"
            >
              {frequencyOptions.map((freq) => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          {/* Instruções */}
          <div className="mb-8">
            <label className="block text-2xl font-bold text-gray-900 mb-4">Instruções Especiais</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Ex: Tomar com água, antes das refeições"
              rows={4}
              className="w-full text-xl p-6 border-4 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Botão Salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-3xl font-black p-8 rounded-3xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 disabled:scale-100"
          >
            {saving ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Save className="w-10 h-10" />
                Salvar Medicamento
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
