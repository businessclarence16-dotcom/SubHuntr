// Client Reddit via snoowrap — se connecte à l'API Reddit avec les credentials
// Nécessite les variables d'environnement : REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET,
// REDDIT_USERNAME, REDDIT_PASSWORD

import Snoowrap from 'snoowrap'

let redditClient: Snoowrap | null = null

export function getRedditClient(): Snoowrap {
  if (redditClient) return redditClient

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const username = process.env.REDDIT_USERNAME
  const password = process.env.REDDIT_PASSWORD

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error(
      'Variables Reddit manquantes. Vérifiez REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD dans .env.local'
    )
  }

  redditClient = new Snoowrap({
    userAgent: 'SubHuntr/1.0.0',
    clientId,
    clientSecret,
    username,
    password,
  })

  // Limite les requêtes pour respecter le rate limit Reddit
  redditClient.config({
    requestDelay: 1000,
    continueAfterRatelimitError: true,
  })

  return redditClient
}
