import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = 'https://afkllzfkeyacejcooxcl.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFma2xsemZrZXlhY2VqY29veGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjQ5ODEsImV4cCI6MjA5NzUwMDk4MX0.A6HC1o4dI5i4I9J05YMLKm4YPNfc2qIBldixc32LDUk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSmtp() {
  console.log('Fetching SMTP configuration from Supabase...');
  const { data, error } = await supabase.from('system_settings').select('*').eq('key', 'smtp_config');
  
  if (error) {
    console.error('Error fetching settings:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.error('No SMTP configuration found in the database. Please configure it in the UI first.');
    return;
  }
  
  const smtpConfig = data[0].value;
  console.log('Retrieved Config:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    username: smtpConfig.username,
    hasPassword: !!smtpConfig.password
  });

  if (!smtpConfig.username || !smtpConfig.password) {
    console.log('Missing username or password. Cannot test connection.');
    return;
  }

  console.log('Setting up Nodemailer transporter...');
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host || 'smtp.gmail.com',
    port: smtpConfig.port || 587,
    secure: smtpConfig.secure || false, // true for 465, false for other ports
    auth: {
      user: smtpConfig.username,
      pass: smtpConfig.password,
    },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Server is ready to take our messages!');
    
    // Fetch target email to send a test message
    const { data: tplData } = await supabase.from('system_settings').select('*').eq('key', 'email_templates');
    let targetEmail = smtpConfig.username; // fallback to self
    if (tplData && tplData.length > 0) {
      const templates = tplData[0].value;
      if (templates.email_recipient?.to_email) {
        targetEmail = templates.email_recipient.to_email;
      }
    }

    console.log(`Sending test email to ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: `"${smtpConfig.senderName || 'Astra'}" <${smtpConfig.senderEmail || smtpConfig.username}>`,
      to: targetEmail,
      subject: "Test Email from Astra 🚀",
      text: "Hello! If you are reading this, your SMTP configuration is working perfectly.",
      html: "<b>Hello!</b><br>If you are reading this, your SMTP configuration is working perfectly. 🚀",
    });

    console.log("✅ Message sent: %s", info.messageId);
  } catch (err) {
    console.error('❌ Failed to verify or send email:', err);
  }
}

testSmtp();
