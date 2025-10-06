import { z } from 'zod';

// Esquema de validación de configuración usando Zod
export const configSchema = z.object({
  // Puerto del servidor
  PORT: z.string().default('3000'),

  // Entorno de ejecución
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Seguridad
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  ALLOWED_ORIGINS: z.string(),

  // Base de datos
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Azure OpenAI
  AZURE_OPENAI_API_KEY: z.string(),
  AZURE_OPENAI_API_ENDPOINT: z.string().url(),
  AZURE_OPENAI_API_VERSION: z.string(),
  AZURE_OPENAI_DEFAULT_MODEL: z.string().default('gpt-4'),

  // Observabilidad
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  // Límites y cuotas
  RATE_LIMIT_WINDOW_MS: z.preprocess(
    val => (val ? parseInt(val as string, 10) : 900000),
    z.number().default(900000)
  ),
  RATE_LIMIT_MAX_REQUESTS: z.preprocess(
    val => (val ? parseInt(val as string, 10) : 100),
    z.number().default(100)
  ),
  AI_BUDGET_LIMIT_EUR: z.preprocess(
    val => (val ? parseFloat(val as string) : 100),
    z.number().default(100)
  ),
  AI_BUDGET_ALERT_THRESHOLD: z.preprocess(
    val => (val ? parseFloat(val as string) : 0.8),
    z.number().default(0.8)
  ),
});

// Función para cargar y validar la configuración
// Lazy-loaded configuration
let cachedConfig: z.infer<typeof configSchema> | null = null;

export function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = configSchema.parse(process.env);
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation errors:');
      error.issues.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Failed to load configuration');
  }
}

// Reset cache for testing
export function resetConfigCache() {
  cachedConfig = null;
  realConfig = null;
}

// Exportar la configuración validada como getter lazy
let realConfig: z.infer<typeof configSchema> | null = null;

export const config: z.infer<typeof configSchema> = new Proxy({} as z.infer<typeof configSchema>, {
  get(target, prop) {
    if (!realConfig) {
      realConfig = loadConfig();
    }
    return realConfig[prop as keyof typeof realConfig];
  },
});

// Exportar el tipo de configuración
export type Config = z.infer<typeof configSchema>;

// Exportar constantes comunes
export const ENV = {
  isDev: config.NODE_ENV === 'development',
  isProd: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',
} as const;

// Exportar helpers de configuración
export function getRequiredConfig<T extends keyof Config>(key: T): Config[T] {
  const value = config[key];
  if (value === undefined) {
    throw new Error(`Required configuration key "${key}" is not set`);
  }
  return value;
}

export function getOptionalConfig<T extends keyof Config>(
  key: T,
  defaultValue: Config[T]
): Config[T] {
  return config[key] ?? defaultValue;
}
