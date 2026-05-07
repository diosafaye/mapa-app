const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

// Helper to keep storage keys consistent with your Supabase storage key
const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode) return defaultValue;

  // We prefix with 'mapa_' to match your project branding
  const storageKey = `mapa_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl && searchParam) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  // If no URL param, check storage, otherwise use default
  const storedValue = storage.getItem(storageKey);
  if (storedValue) return storedValue;
  
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  return null;
}

const getAppParams = () => {
  // Clear Token Logic: 
  // If the URL has ?clear_session=true, we wipe the Supabase auth token
  if (getAppParamValue("clear_session") === 'true') {
    storage.removeItem('mapa-bohol-auth-key'); // Matches your Supabase storageKey
  }

  return {
    // These pull from your .env file as fallbacks
    appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_SUPABASE_PROJECT_ID }),
    fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
    appBaseUrl: getAppParamValue("app_base_url", { defaultValue: window.location.origin }),
    // You can add other custom params here for your Heritage System
    systemVersion: getAppParamValue("version", { defaultValue: "1.0.0" }),
  }
}

export const appParams = {
  ...getAppParams()
}