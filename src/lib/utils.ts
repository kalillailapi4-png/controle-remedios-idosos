// Utilitários gerais
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function getNextScheduledTime(schedules: string[]): string | null {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const upcomingSchedules = schedules
    .map(schedule => {
      const [hours, minutes] = schedule.split(':').map(Number);
      return { time: schedule, totalMinutes: hours * 60 + minutes };
    })
    .filter(s => s.totalMinutes > currentTime)
    .sort((a, b) => a.totalMinutes - b.totalMinutes);

  return upcomingSchedules.length > 0 ? upcomingSchedules[0].time : schedules[0];
}

export function compressImage(file: File, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export const medicationColors = [
  { name: 'Branco', value: '#FFFFFF', border: '#E5E7EB' },
  { name: 'Amarelo', value: '#FEF08A' },
  { name: 'Rosa', value: '#FBCFE8' },
  { name: 'Azul', value: '#BFDBFE' },
  { name: 'Verde', value: '#BBF7D0' },
  { name: 'Laranja', value: '#FED7AA' },
  { name: 'Roxo', value: '#DDD6FE' },
  { name: 'Vermelho', value: '#FECACA' },
  { name: 'Marrom', value: '#D6BCAB' },
];

export const medicationTypes = [
  { value: 'comprimido', label: 'Comprimido', icon: '💊' },
  { value: 'capsula', label: 'Cápsula', icon: '💊' },
  { value: 'liquido', label: 'Líquido', icon: '🧪' },
  { value: 'pomada', label: 'Pomada', icon: '🧴' },
  { value: 'injecao', label: 'Injeção', icon: '💉' },
];

export const frequencyOptions = [
  '1x ao dia',
  '2x ao dia',
  '3x ao dia',
  '4x ao dia',
  'A cada 4 horas',
  'A cada 6 horas',
  'A cada 8 horas',
  'A cada 12 horas',
  'Quando necessário',
];
