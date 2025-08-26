const fetch = require('node-fetch');

const PERSONAL_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzU2MjQ5MjQyLCJqdGkiOiIzYTAzZmUxMS0xMmU3LTQ5YTktYTc1YS00MDQ0NDMwMGJkYzYiLCJ1c2VyX3V1aWQiOiIzYjFmYThkZC04YjExLTQ2MDItOGVlYy1lYTgwMzVjMGU2NmEifQ.kcVLNqKkmlTDTfEywrN-8S2TPDzfB1xE-DTHzYx2y7pIdjLKGBgUX-BlzZNjEwDZfPkKqFo-s3YnZtjdbsdkPQ';

// First, get your organization URI
async function getOrganization() {
  const response = await fetch('https://api.calendly.com/users/me', {
    headers: {
      'Authorization': `Bearer ${PERSONAL_TOKEN}`
    }
  });
  const data = await response.json();
  console.log('Your organization URI:', data.resource.current_organization);
  return data.resource.current_organization;
}

// Then create the webhook
async function createWebhook(orgUri) {
  const response = await fetch('https://api.calendly.com/webhook_subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERSONAL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://estate-intake-system.onrender.com/webhook/calendly',  // Your actual backend URL
      events: ['invitee.created', 'invitee.canceled'],
      organization: orgUri,
      scope: 'organization'
    })
  });
  
  const data = await response.json();
  console.log('Webhook created:', data);
  console.log('IMPORTANT - Save this signing key:', data.resource.signing_key);
  return data.resource.signing_key;
}

// Run the setup
async function setup() {
  const orgUri = await getOrganization();
  const signingKey = await createWebhook(orgUri);
  console.log('\n\nAdd this to your environment variables:');
  console.log(`CALENDLY_WEBHOOK_SECRET=${signingKey}`);
}

setup();
