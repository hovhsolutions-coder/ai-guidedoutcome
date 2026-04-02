// Central configuration for the application

export const config = {
  app: {
    name: 'AI Guided Outcome Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
};
