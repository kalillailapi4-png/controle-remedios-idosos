// Sistema de banco de dados local (IndexedDB) para funcionar offline
export interface Medication {
  id: string;
  name: string;
  photo?: string; // Base64 da foto
  color: string;
  type: 'comprimido' | 'capsula' | 'liquido' | 'pomada' | 'injecao';
  dosage: string;
  schedules: string[]; // Array de horários "HH:MM"
  frequency: string; // "1x ao dia", "2x ao dia", etc
  startDate: string;
  endDate?: string;
  instructions?: string;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string; // ISO string
  takenAt?: string; // ISO string
  status: 'pending' | 'taken' | 'skipped' | 'delayed';
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessCode: string;
  canEdit: boolean;
  createdAt: string;
}

export interface Settings {
  id: string;
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  vibrationEnabled: boolean;
  reminderInterval: number; // minutos
  pin?: string;
  backupEnabled: boolean;
}

class MedicDatabase {
  private dbName = 'MedicFacilDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store de medicamentos
        if (!db.objectStoreNames.contains('medications')) {
          const medicationStore = db.createObjectStore('medications', { keyPath: 'id' });
          medicationStore.createIndex('name', 'name', { unique: false });
        }

        // Store de logs
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' });
          logStore.createIndex('medicationId', 'medicationId', { unique: false });
          logStore.createIndex('scheduledTime', 'scheduledTime', { unique: false });
        }

        // Store de familiares
        if (!db.objectStoreNames.contains('family')) {
          db.createObjectStore('family', { keyPath: 'id' });
        }

        // Store de configurações
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  // MEDICATIONS
  async addMedication(medication: Medication): Promise<void> {
    const tx = this.db!.transaction('medications', 'readwrite');
    const store = tx.objectStore('medications');
    await store.add(medication);
  }

  async updateMedication(medication: Medication): Promise<void> {
    const tx = this.db!.transaction('medications', 'readwrite');
    const store = tx.objectStore('medications');
    await store.put(medication);
  }

  async deleteMedication(id: string): Promise<void> {
    const tx = this.db!.transaction('medications', 'readwrite');
    const store = tx.objectStore('medications');
    await store.delete(id);
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const tx = this.db!.transaction('medications', 'readonly');
    const store = tx.objectStore('medications');
    return store.get(id);
  }

  async getAllMedications(): Promise<Medication[]> {
    const tx = this.db!.transaction('medications', 'readonly');
    const store = tx.objectStore('medications');
    return store.getAll();
  }

  // LOGS
  async addLog(log: MedicationLog): Promise<void> {
    const tx = this.db!.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    await store.add(log);
  }

  async updateLog(log: MedicationLog): Promise<void> {
    const tx = this.db!.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    await store.put(log);
  }

  async getLogsByDate(date: string): Promise<MedicationLog[]> {
    const tx = this.db!.transaction('logs', 'readonly');
    const store = tx.objectStore('logs');
    const allLogs = await store.getAll();
    return allLogs.filter(log => log.scheduledTime.startsWith(date));
  }

  async getLogsByMedication(medicationId: string): Promise<MedicationLog[]> {
    const tx = this.db!.transaction('logs', 'readonly');
    const store = tx.objectStore('logs');
    const index = store.index('medicationId');
    return index.getAll(medicationId);
  }

  // SETTINGS
  async getSettings(): Promise<Settings> {
    const tx = this.db!.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const settings = await store.get('main');
    
    if (!settings) {
      const defaultSettings: Settings = {
        id: 'main',
        fontSize: 'extra-large',
        highContrast: false,
        soundEnabled: true,
        voiceEnabled: true,
        vibrationEnabled: true,
        reminderInterval: 5,
        backupEnabled: false,
      };
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }
    
    return settings;
  }

  async saveSettings(settings: Settings): Promise<void> {
    const tx = this.db!.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    await store.put(settings);
  }

  // FAMILY
  async addFamilyMember(member: FamilyMember): Promise<void> {
    const tx = this.db!.transaction('family', 'readwrite');
    const store = tx.objectStore('family');
    await store.add(member);
  }

  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    const tx = this.db!.transaction('family', 'readonly');
    const store = tx.objectStore('family');
    return store.getAll();
  }

  async deleteFamilyMember(id: string): Promise<void> {
    const tx = this.db!.transaction('family', 'readwrite');
    const store = tx.objectStore('family');
    await store.delete(id);
  }
}

export const db = new MedicDatabase();
