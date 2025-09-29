
  PORT: z.string().default(
  NODE_ENV: z.enum(['development', 'test', 'production']).default(

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
  AZURE_OPENAI_DEFAULT_MODEL: z.string().default(

  // Observabilidad
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default(
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),

  // Límites y cuotas
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(
  AI_BUDGET_LIMIT_EUR: z.string().transform(Number).default(
  AI_BUDGET_ALERT_THRESHOLD: z.string().transform(Number).default(
});

// Función para cargar y validar la configuración
export function loadConfig() {
  try {
    const config = configSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
      error.errors.forEach((err) => {
        console.error(
      });
    }
    throw new Error(
  }
}

// Exportar la configuración validada
export const config = loadConfig();

// Tipos derivados del esquema
export type Config = z.infer<typeof configSchema>;

// Exportar constantes comunes
export const ENV = {
  isDev: config.NODE_ENV 
  isProd: config.NODE_ENV 
  isTest: config.NODE_ENV 
} as const;

// Exportar helpers de configuración
export function getRequiredConfig<T>(key: keyof Config): T {
  const value = config[key];
  if (value === undefined) {
    throw new Error(
  }
  return value as T;
}

export function getOptionalConfig<T>(key: keyof Config, defaultValue: T): T {
  const value = config[key];
  return (value === undefined ? defaultValue : value) as T;
}