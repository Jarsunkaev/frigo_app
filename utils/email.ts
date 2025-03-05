// utils/email.ts
type EmailType = 
  | 'subscription_active'
  | 'subscription_canceled'
  | 'payment_failed'
  | 'trial_ending'
  | 'trial_started'
  | 'payment_succeeded';

interface EmailData {
  to: string;
  type: EmailType;
  data: Record<string, any>;
}

const emailTemplates = {
  subscription_active: (data: any) => ({
    subject: 'Welcome to FRIGO Premium!',
    body: `Your premium subscription is now active! You have access to all premium features until ${data.endDate}.`
  }),
  
  subscription_canceled: () => ({
    subject: 'Your FRIGO Premium Subscription Has Been Canceled',
    body: 'Your premium subscription has been canceled. You can still use the free version of FRIGO.'
  }),
  
  payment_failed: (data: any) => ({
    subject: 'Action Required: Payment Failed',
    body: `We couldn't process your payment. Please update your payment method: ${data.retryLink}`
  }),
  
  trial_ending: (data: any) => ({
    subject: 'Your FRIGO Premium Trial Is Ending Soon',
    body: `Your free trial will end on ${data.endDate}. To keep your premium benefits, please ensure your payment method is up to date.`
  })
};

export async function sendEmail({ to, type, data }: EmailData) {
  const template = emailTemplates[type](data);
  
  // For development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('Email would be sent:', {
      to,
      subject: template.subject,
      body: template.body
    });
    return;
  }

  // TODO: Implement your preferred email service here
  // Example with SendGrid:
  // await sendgrid.send({
  //   to,
  //   from: 'your@email.com',
  //   subject: template.subject,
  //   text: template.body,
  // });
}