import { createClient } from '@supabase/supabase-js';
import { seedData } from './seedData.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isTestMode = import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.location.search.includes('test=true');

const forceLocalFallback = import.meta.env.DEV &&
  import.meta.env.VITE_FORCE_LOCAL_AUTH === 'true';

export const hasSupabase = !isTestMode &&
  !forceLocalFallback &&
  supabaseUrl &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isFallbackMode = !hasSupabase;

const getLocalDB = () => {
  const data = localStorage.getItem('astra_db');
  if (!data) {
    localStorage.setItem('astra_db', JSON.stringify(seedData));
    return seedData;
  }
  try {
    return JSON.parse(data);
  } catch {
    localStorage.setItem('astra_db', JSON.stringify(seedData));
    return seedData;
  }
};

const setLocalDB = (db) => localStorage.setItem('astra_db', JSON.stringify(db));

class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = getLocalDB();
    this.data = [...(this.db[tableName] || [])];
    this.error = null;
  }

  select() { return this; }

  insert(values) {
    const valueArray = Array.isArray(values) ? values : [values];
    const newItems = valueArray.map(item => ({
      id: item.id || Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
      ...item
    }));
    this.db[this.tableName] = [...(this.db[this.tableName] || []), ...newItems];
    setLocalDB(this.db);
    this.data = newItems;
    return this;
  }

  update(values) { this.updateValues = values; return this; }
  delete() { this.isDelete = true; return this; }

  upsert(values) {
    const valueArray = Array.isArray(values) ? values : [values];
    valueArray.forEach(item => {
      const idx = this.db[this.tableName].findIndex(
        x => x.key === item.key || x.id === item.id ||
             (x.platform_name && x.platform_name === item.platform_name)
      );
      if (idx > -1) {
        this.db[this.tableName][idx] = { ...this.db[this.tableName][idx], ...item, updated_at: new Date().toISOString() };
      } else {
        this.db[this.tableName].push({ id: item.id || Math.random().toString(36).substring(2, 11), created_at: new Date().toISOString(), ...item });
      }
    });
    setLocalDB(this.db);
    this.data = valueArray;
    return this;
  }

  eq(column, value) {
    if (this.updateValues) {
      this.db[this.tableName] = this.db[this.tableName].map(item =>
        item[column] === value ? { ...item, ...this.updateValues } : item
      );
      setLocalDB(this.db);
      this.data = this.db[this.tableName].filter(item => item[column] === value);
    } else if (this.isDelete) {
      this.db[this.tableName] = this.db[this.tableName].filter(item => item[column] !== value);
      setLocalDB(this.db);
      this.data = [];
    } else {
      this.data = this.data.filter(item => item[column] === value);
    }
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.data.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  then(onfulfilled) {
    return Promise.resolve(onfulfilled({ data: this.data, error: this.error }));
  }
}

const mockSupabase = {
  from(tableName) { return new MockQueryBuilder(tableName); },
  isFallback: true
};

const realSupabase = hasSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;
let fallbackLogged = false;

// Wrapper that executes a real Supabase query; if it fails with a table or
// network error, silently falls back to the localStorage mock so the UI keeps
// working even when Supabase tables are missing.
async function withFallback(operation) {
  if (!realSupabase) {
    return operation(mockSupabase);
  }
  try {
    return await operation(realSupabase);
  } catch (err) {
    const message = err?.message || '';
    const isMissingTable = /relation ".*" does not exist|Table '\w+' doesn't exist|42P01|could not connect|NetworkError|Failed to fetch/i.test(message);
    if (isMissingTable) {
      if (!fallbackLogged) {
        console.warn('Supabase query failed; falling back to localStorage mock.', err);
        fallbackLogged = true;
      }
      return operation(mockSupabase);
    }
    throw err;
  }
}

export const supabase = {
  from(tableName) {
    return {
      select: (...args) => build((client) => client.from(tableName).select(...args)),
      insert: (values) => build((client) => client.from(tableName).insert(values)),
      update: (values) => ({
        eq: (column, value) => build((client) => client.from(tableName).update(values).eq(column, value))
      }),
      delete: () => ({
        eq: (column, value) => build((client) => client.from(tableName).delete().eq(column, value))
      }),
      upsert: (values) => build((client) => client.from(tableName).upsert(values))
    };
  },
  auth: realSupabase ? realSupabase.auth : {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } })
  },
  isFallback: !hasSupabase
};

function build(queryFn) {
  const chain = {
    // Chain without awaiting: the builder is thenable, so awaiting resolves
    // it to {data, error} (no .order/.eq) and crashes the next chain call.
    order: (column, options) => build((client) => queryFn(client).order(column, options)),
    eq: (column, value) => build((client) => queryFn(client).eq(column, value)),
    then: (onfulfilled, onrejected) => withFallback(queryFn).then(onfulfilled, onrejected)
  };
  return chain;
}

export const getSupabaseConfig = () => ({ hasSupabase, supabaseUrl, supabaseAnonKey });
