import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://afkllzfkeyacejcooxcl.supabase.co/', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2xsemZrZXlhY2VqY29veGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjQ5ODEsImV4cCI6MjA5NzUwMDk4MX0.A6HC1o4dI5i4I9J05YMLKm4YPNfc2qIBldixc32LDUk');

async function testInsert() {
  const { data: services } = await supabase.from('services').select('id').limit(1);
  
  const payload = {
    cname: 'Test Customer',
    email: 'test@example.com',
    phone: '1234567890',
    service_id: services[0].id,
    note: 'Test note',
    notify_before_days: 7,
    expiry_date: '2026-06-22',
    status: 'active'
  };

  const { data, error } = await supabase.from('customers').insert(payload);
  
  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success! Inserted row without recipient_emails.');
    // clean up test row
    if (data && data[0]) await supabase.from('customers').delete().eq('id', data[0].id);
  }
}

testInsert();
