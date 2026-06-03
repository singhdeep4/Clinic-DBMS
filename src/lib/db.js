const DB_NAME = "ayurkaya_clinic_db";
const DB_VERSION = 4;

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB Open Error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains("cases")) {
          db.createObjectStore("cases", { keyPath: "patientId" });
        }
        if (!db.objectStoreNames.contains("queue")) {
          db.createObjectStore("queue", { keyPath: "id" });
        }
      }

      if (oldVersion < 3) {
        if (db.objectStoreNames.contains("registry")) {
          db.deleteObjectStore("registry");
        }
        db.createObjectStore("registry", { keyPath: "patientId" });
      }

      // Upgrade registry and cases to version 4 to force clean sequential 8-digit logical IDs
      if (oldVersion < 4) {
        if (db.objectStoreNames.contains("cases")) {
          db.deleteObjectStore("cases");
        }
        db.createObjectStore("cases", { keyPath: "patientId" });

        if (db.objectStoreNames.contains("registry")) {
          db.deleteObjectStore("registry");
        }
        db.createObjectStore("registry", { keyPath: "patientId" });
        
        localStorage.removeItem("ayurkaya_indexeddb_migrated");
      }
    };
  });
}

export async function getAllItems(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putItem(storeName, item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteItem(storeName, key) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Automatic one-time migration from LocalStorage to IndexedDB
export async function migrateFromLocalStorage() {
  const isMigrated = localStorage.getItem("ayurkaya_indexeddb_migrated");
  if (isMigrated === "true") return;

  console.log("Starting data migration to IndexedDB (v4 with 8-digit patientId sequence)...");

  try {
    // 1. Migrate Cases with 8-digit sequence (PAT-00000001)
    const migratedCases = [];
    const localCasesStr = localStorage.getItem("ayurkaya_patient_cases");
    if (localCasesStr) {
      const cases = JSON.parse(localCasesStr);
      if (Array.isArray(cases)) {
        let count = 1;
        for (const c of cases) {
          if (c.name || c.mobile) {
            const logicalId = `PAT-${String(count++).padStart(8, "0")}`;
            const updatedCase = { ...c, patientId: logicalId };
            await putItem("cases", updatedCase);
            migratedCases.push(updatedCase);
          }
        }
      }
    }

    // 2. Migrate Registry
    const localRegistryStr = localStorage.getItem("ayurkaya_patient_registry");
    if (localRegistryStr) {
      const registry = JSON.parse(localRegistryStr);
      if (typeof registry === "object" && registry !== null) {
        let count = migratedCases.length + 1;
        for (const mobile in registry) {
          const item = registry[mobile];
          if (item) {
            // Find if there is a migrated case with the same mobile and name
            const matchingCase = migratedCases.find(
              c => {
                const cMobile = (c.mobile || "").replace(/[^0-9]/g, "");
                const rMobile = mobile.replace(/[^0-9]/g, "");
                return cMobile === rMobile && 
                       (c.name || "").trim().toLowerCase() === (item.name || "").trim().toLowerCase();
              }
            );

            // Re-use logical patientId from matching case if it exists, otherwise generate next in sequence
            const patientId = matchingCase ? matchingCase.patientId : `PAT-${String(count++).padStart(8, "0")}`;

            await putItem("registry", {
              patientId,
              name: item.name || "",
              age: item.age || "",
              gender: item.gender || "Male",
              mobile: mobile.replace(/[^0-9]/g, ""),
              occupation: item.occupation || "",
              updatedAt: item.updatedAt || new Date().toISOString()
            });
          }
        }
      }
    }

    // 3. Migrate Live Queue
    const localQueueStr = localStorage.getItem("ayurkaya_live_queue");
    if (localQueueStr) {
      const queue = JSON.parse(localQueueStr);
      if (Array.isArray(queue)) {
        for (const q of queue) {
          if (q.id) {
            await putItem("queue", q);
          }
        }
      }
    }

    // Mark as migrated
    localStorage.setItem("ayurkaya_indexeddb_migrated", "true");
    console.log("Migration to IndexedDB v4 completed successfully.");
  } catch (err) {
    console.error("Migration error:", err);
  }
}
