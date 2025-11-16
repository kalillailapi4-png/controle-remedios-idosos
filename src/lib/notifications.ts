// Sistema de notificações e lembretes
import { Medication } from './db';

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notificações não suportadas neste navegador');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(medication: Medication, scheduledTime: string): Promise<void> {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission !== 'granted') {
      return;
    }

    const notification = new Notification('⏰ Hora do Remédio!', {
      body: `${medication.name}\n${medication.dosage}\n${scheduledTime}`,
      icon: medication.photo || '/icon-512x512.png',
      badge: '/icon-192x192.png',
      tag: `medication-${medication.id}-${scheduledTime}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
    });

    // Som de alerta
    this.playAlertSound();

    // Vibração
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Leitura em voz alta
    this.speakMedication(medication);

    notification.onclick = () => {
      window.focus();
      notification.close();
      window.location.href = '/tomar-agora';
    };
  }

  private playAlertSound(): void {
    try {
      const audio = new Audio('/alert.mp3');
      audio.volume = 1.0;
      audio.play().catch(err => console.warn('Erro ao tocar som:', err));
    } catch (err) {
      console.warn('Erro ao criar áudio:', err);
    }
  }

  private speakMedication(medication: Medication): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const text = `Atenção! Hora de tomar o remédio ${medication.name}. Dosagem: ${medication.dosage}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8; // Mais devagar para idosos
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  scheduleNotification(medication: Medication, scheduledTime: string): void {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDate = new Date(now);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Se o horário já passou hoje, agendar para amanhã
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const timeUntilNotification = scheduledDate.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification(medication, scheduledTime);
    }, timeUntilNotification);
  }

  cancelAllNotifications(): void {
    // Limpar notificações pendentes (não há API direta, mas podemos limpar as visíveis)
    if ('serviceWorker' in navigator && 'getNotifications' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }
  }
}

export const notificationManager = NotificationManager.getInstance();
