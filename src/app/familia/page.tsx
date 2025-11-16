'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, FamilyMember } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { ArrowLeft, UserPlus, Mail, Phone, Key, Trash2, Shield } from 'lucide-react';

export default function Familia() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    canEdit: false,
  });

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      await db.init();
      const familyMembers = await db.getAllFamilyMembers();
      setMembers(familyMembers);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar familiares:', error);
      setLoading(false);
    }
  };

  const generateAccessCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleAddMember = async () => {
    if (!formData.name || !formData.email) {
      alert('Por favor, preencha nome e email.');
      return;
    }

    try {
      const member: FamilyMember = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        accessCode: generateAccessCode(),
        canEdit: formData.canEdit,
        createdAt: new Date().toISOString(),
      };

      await db.addFamilyMember(member);
      setMembers([...members, member]);
      setFormData({ name: '', email: '', phone: '', canEdit: false });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar familiar:', error);
      alert('Erro ao adicionar familiar. Tente novamente.');
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este familiar?')) return;

    try {
      await db.deleteFamilyMember(id);
      setMembers(members.filter(m => m.id !== id));
    } catch (error) {
      console.error('Erro ao remover familiar:', error);
      alert('Erro ao remover familiar. Tente novamente.');
    }
  };

  const shareAccessCode = (member: FamilyMember) => {
    const message = `Você foi adicionado ao MedicFácil!\n\nCódigo de Acesso: ${member.accessCode}\n\nUse este código para acompanhar os medicamentos.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Código de Acesso - MedicFácil',
        text: message,
      });
    } else {
      navigator.clipboard.writeText(message);
      alert('Código copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-3xl font-bold text-pink-900">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-4 bg-white hover:bg-gray-100 rounded-2xl shadow-lg transition-all"
          >
            <ArrowLeft className="w-8 h-8 text-gray-700" />
          </button>
          <h1 className="text-4xl font-black text-pink-900">Modo Família</h1>
        </div>

        {/* Informação */}
        <div className="bg-blue-50 border-4 border-blue-200 rounded-3xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-black text-blue-900 mb-2">Como Funciona</h3>
              <p className="text-xl text-blue-800">
                Adicione familiares para que eles possam acompanhar seus medicamentos em tempo real. 
                Você pode dar permissão de edição ou apenas visualização.
              </p>
            </div>
          </div>
        </div>

        {/* Botão Adicionar */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-3xl font-black p-8 rounded-3xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 mb-6"
          >
            <UserPlus className="w-12 h-12 mx-auto mb-3" />
            Adicionar Familiar
          </button>
        )}

        {/* Formulário de Adicionar */}
        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Novo Familiar</h2>

            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-2xl font-bold text-gray-900 mb-3">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  className="w-full text-2xl p-6 border-4 border-gray-300 rounded-2xl focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-2xl font-bold text-gray-900 mb-3">Email</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="w-full text-2xl p-6 pl-16 border-4 border-gray-300 rounded-2xl focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-2xl font-bold text-gray-900 mb-3">Telefone (opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full text-2xl p-6 pl-16 border-4 border-gray-300 rounded-2xl focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissão de Edição */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-2xl font-bold text-gray-900">Permitir Edição</p>
                  <p className="text-lg text-gray-600 mt-1">Familiar pode adicionar/remover medicamentos</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, canEdit: !formData.canEdit })}
                  className={`w-20 h-10 rounded-full transition-all ${
                    formData.canEdit ? 'bg-pink-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 bg-white rounded-full transition-all ${
                    formData.canEdit ? 'ml-10' : 'ml-1'
                  }`}></div>
                </button>
              </div>

              {/* Botões */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-6 bg-gray-200 hover:bg-gray-300 text-gray-900 text-2xl font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddMember}
                  className="p-6 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-2xl font-bold rounded-2xl transition-all"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Familiares */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-3xl font-black text-gray-900 mb-6">Familiares Cadastrados</h2>

          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-4">👨‍👩‍👧‍👦</div>
              <p className="text-2xl text-gray-500 font-medium">Nenhum familiar cadastrado</p>
              <p className="text-xl text-gray-400 mt-2">Adicione familiares para compartilhar o controle</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">{member.name}</h3>
                      <div className="space-y-1">
                        <p className="text-lg text-gray-600 flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          {member.email}
                        </p>
                        {member.phone && (
                          <p className="text-lg text-gray-600 flex items-center gap-2">
                            <Phone className="w-5 h-5" />
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-2 rounded-xl text-lg font-bold ${
                      member.canEdit ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {member.canEdit ? '✏️ Pode Editar' : '👁️ Apenas Visualizar'}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border-4 border-dashed border-pink-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Código de Acesso</p>
                        <p className="text-3xl font-black text-pink-600 tracking-wider">{member.accessCode}</p>
                      </div>
                      <button
                        onClick={() => shareAccessCode(member)}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white text-lg font-bold rounded-xl transition-all"
                      >
                        Compartilhar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
