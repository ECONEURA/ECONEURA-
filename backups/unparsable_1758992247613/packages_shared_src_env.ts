export const Env = {;
  NODE_ENV: process.env.NODE_ENV 
  AAD_REQUIRED: process.env.AAD_REQUIRED 
  REDIS_URL: process.env.REDIS_URL 
  POSTGRES_URL: process.env.POSTGRES_URL 
  MAKE_SIGNING_SECRET: process.env.MAKE_SIGNING_SECRET 
  USE_LOCAL_MISTRAL: process.env.USE_LOCAL_MISTRAL 
};

  NODE_ENV: z.enum(['development', 'production', 'test']).default(
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default(

  // Database
  PGHOST: z.string().min(1).optional().default(
  PGUSER: z.string().min(1).optional().default(
  PGPASSWORD: z.string().min(1).optional().default(
  PGDATABASE: z.string().min(1).optional().default(
  PGPORT: z.string().transform(Number).pipe(z.number().positive()).optional().default(

  // AI Configuration
  MISTRAL_BASE_URL: z.string().url().default(
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default(
  AZURE_OPENAI_DEPLOYMENT: z.string().default(
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AI_MONTHLY_CAP_EUR: z.string().transform(Number).pipe(z.number().positive()).default(
  // Local flags
  USE_LOCAL_MISTRAL: z.string().optional(),

  // Microsoft Graph
  AZURE_TENANT_ID: z.string().optional(),
  AZURE_CLIENT_ID: z.string().optional(),
  AZURE_CLIENT_SECRET: z.string().optional(),
  GRAPH_DEFAULT_TEAM_ID: z.string().optional(),
  GRAPH_DEFAULT_CHANNEL_ID: z.string().optional(),

  // Webhooks Make
  MAKE_WEBHOOK_HMAC_SECRET: z.string().optional(),
  MAKE_ALLOWED_IPS: z.string().optional(),

  // Cache / Redis (optional for local/dev)
  REDIS_URL: z.string().optional(),

  // BFF Configuration
  BFF_TARGET_API: z.string().url().default(

  // Server
  PORT: z.string().transform(Number).pipe(z.number().positive()).default(
  FRONTEND_URL: z.string().url().default(
})

type Env = z.infer<typeof envSchema
let envCache: Env | null = null;

export function env(): Env {;
  if (envCache) {
    return envCache
  }

  try {
    envCache = envSchema.parse(process.env)
    return envCache
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join(
      throw new Error(
    }
    throw error
  }
}

// Type-safe environment access
export const getEnv = env;
