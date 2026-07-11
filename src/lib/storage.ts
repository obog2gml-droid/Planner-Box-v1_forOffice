import localforage from "localforage";

localforage.config({
  name: "planner-box-office",
  storeName: "planner_store"
});

const MIGRATION_DONE_KEY = "timebox-migration-done";

const KEYS_TO_MIGRATE = [
  "timebox-last-week-v2",
  "timebox-tasks-v2",
  "timebox-title-v2",
  "timebox-subtitle-v2",
  "timebox-brain-v2",
  "timebox-big3-v2",
  "timebox-consultants-v2",
  "timebox-popped-missed-ids-v2",
  "timebox-archives",
];

export async function runMigration(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const isDone = await localforage.getItem<boolean>(MIGRATION_DONE_KEY);
    if (isDone) return;

    // Migrate standard keys
    for (const key of KEYS_TO_MIGRATE) {
      const val = window.localStorage.getItem(key);
      if (val !== null) {
        try {
          const parsed = JSON.parse(val);
          await localforage.setItem(key, parsed);
        } catch {
          await localforage.setItem(key, val);
        }
      }
    }

    // Special check for legacy popped-missed-v2
    const legacyPopped = window.localStorage.getItem("timebox-popped-missed-v2");
    const currentPopped = window.localStorage.getItem("timebox-popped-missed-ids-v2");
    if (!currentPopped && legacyPopped) {
      try {
        const parsed = JSON.parse(legacyPopped);
        await localforage.setItem("timebox-popped-missed-ids-v2", parsed);
      } catch {
        await localforage.setItem("timebox-popped-missed-ids-v2", legacyPopped);
      }
    }

    // Mark migration as done
    await localforage.setItem(MIGRATION_DONE_KEY, true);

    // Remove legacy localstorage keys to free up space
    for (const key of KEYS_TO_MIGRATE) {
      window.localStorage.removeItem(key);
    }
    window.localStorage.removeItem("timebox-popped-missed-v2");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

export async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const val = await localforage.getItem<T>(key);
    if (val === null || val === undefined) {
      return defaultValue;
    }
    return val;
  } catch {
    return defaultValue;
  }
}

export async function setStorageItem<T>(key: string, value: T): Promise<T> {
  try {
    return await localforage.setItem<T>(key, value);
  } catch (err) {
    console.error(`Failed to set storage item for key: ${key}`, err);
    return value;
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await localforage.removeItem(key);
  } catch (err) {
    console.error(`Failed to remove storage item for key: ${key}`, err);
  }
}
