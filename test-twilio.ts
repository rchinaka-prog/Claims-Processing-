import twilio from 'twilio';
console.log('Is Twilio on default export?', !!(twilio as any).Twilio);
if ((twilio as any).Twilio) {
  console.log('Type of twilio.Twilio:', typeof (twilio as any).Twilio);
}
