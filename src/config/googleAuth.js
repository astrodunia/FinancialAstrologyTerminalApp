const googleServices = require('../../android/app/google-services.json');

const getGoogleWebClientId = () => {
  const clients = Array.isArray(googleServices?.client) ? googleServices.client : [];

  for (const client of clients) {
    const oauthClients = Array.isArray(client?.oauth_client) ? client.oauth_client : [];
    const webClient = oauthClients.find(
      (oauthClient) =>
        Number(oauthClient?.client_type) === 3 &&
        typeof oauthClient?.client_id === 'string' &&
        oauthClient.client_id.endsWith('.apps.googleusercontent.com'),
    );

    if (webClient?.client_id) {
      return webClient.client_id;
    }
  }

  throw new Error('Google webClientId with client_type 3 was not found in android/app/google-services.json');
};

export const GOOGLE_WEB_CLIENT_ID = getGoogleWebClientId();

