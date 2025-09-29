// ============================================================================
// TEMPLATE ENGINE - HANDLEBARS, MUSTACHE, MULTI-LANGUAGE
// =========================================================================
  engine: z.enum(['handlebars', 'mustache', 
  defaultLanguage: z.string().default(
  supportedLanguages: z.array(z.string()).default(['es', 'en', 'fr', 
  cacheEnabled: z.boolean().default(true),
  cacheSize: z.number().min(1).max(1000).default(100),
  strictMode: z.boolean().default(true),
  escapeHtml: z.boolean().default(true)
});

const TemplateSchema = z.object({;
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['email', 'sms', 'push', 'in_app', 
  language: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()),
  isActive: z.boolean().default(true),
  version: z.number().default(1),
  createdAt: z.date(),
  updatedAt: z.date()
});

const TemplateRenderRequestSchema = z.object({;
  templateId: z.string(),
  language: z.string().optional(),
  variables: z.record(z.any()),
  context: z.record(z.any()).optional(),
  options: z.object({
    escapeHtml: z.boolean().optional(),
    strictMode: z.boolean().optional(),
    fallbackLanguage: z.string().optional()
  }).optional()
});

// ============================================================================
// INTERFACES
// =========================================================================
export interface TemplateEngineConfig {;
  engine: 'handlebars' | 'mustache' | 
  defaultLanguage: string;
  supportedLanguages: string[];
  cacheEnabled: boolean;
  cacheSize: number;
  strictMode: boolean;
  escapeHtml: boolean;
}

export interface Template {;
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 
  language: string;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateRenderRequest {;
  templateId: string;
  language?: string;
  variables: Record<string, any>;
  context?: Record<string, any>;
  options?: {
    escapeHtml?: boolean;
    strictMode?: boolean;
    fallbackLanguage?: string;
  };
}

export interface TemplateRenderResult {;
  subject?: string;
  body: string;
  language: string;
  templateId: string;
  variables: Record<string, any>;
  metadata: {
    engine: string;
    renderTime: number;
    cacheHit: boolean;
    warnings: string[];
  };
}

export interface ITemplateEngine {;
  render(request: TemplateRenderRequest): Promise<TemplateRenderResult>;
  validateTemplate(template: Template): Promise<{ valid: boolean; errors: string[] }>;
  getTemplate(templateId: string, language?: string): Promise<Template | null>;
  listTemplates(type?: string, language?: string): Promise<Template[]>;
  clearCache(): Promise<void>;
}

// ============================================================================
// HANDLEBARS ENGINE
// =========================================================================
export class HandlebarsEngine implements ITemplateEngine {;
  private config: TemplateEngineConfig;
  private templates: Map<string, Template> = new Map();
  private compiledTemplates: Map<string, any> = new Map();
  private cache: Map<string, TemplateRenderResult> = new Map();

  constructor(config: TemplateEngineConfig) {
    this.config = config;
    this.initializeDefaultTemplates();
  }

  async render(request: TemplateRenderRequest): Promise<TemplateRenderResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    try {
      // Check cache first
      if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        logger.info(
          templateId: request.templateId,
          language: request.language,
          cacheHit: true
        });
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true,
            renderTime: Date.now() - startTime
          }
        };
      }

      // Get template
      const template = await this.getTemplate(request.templateId, request.language);
      if (!template) {
        throw new Error(
      }

      // Compile template if not cached
      const compiledKey = 
      let compiledTemplate = this.compiledTemplates.get(compiledKey);
      
      if (!compiledTemplate) {
        compiledTemplate = this.compileHandlebarsTemplate(template);
        this.compiledTemplates.set(compiledKey, compiledTemplate);
      }

      // Prepare context
      const context = {;
        ...request.variables,
        ...request.context,
        _meta: {
          timestamp: new Date().toISOString(),
          language: template.language,
          templateId: template.id,
          version: template.version
        }
      };

      // Render template
      const renderedBody = compiledTemplate(context);
      const renderedSubject = template.subject ? this.compileHandlebarsTemplate({ ...template, body: template.subject })(context) : undefined;

      const result: TemplateRenderResult = {;
        subject: renderedSubject,
        body: renderedBody,
        language: template.language,
        templateId: template.id,
        variables: request.variables,
        metadata: {
          engine
          renderTime: Date.now() - startTime,
          cacheHit: false,
          warnings: []
        }
      };

      // Cache result
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, result);
        this.cleanupCache();
      }

      logger.info(
        templateId: request.templateId,
        language: template.language,
        renderTime: result.metadata.renderTime,
        cacheHit: false
      });

      return result;

    } catch (error) {
      logger.error(
        templateId: request.templateId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async validateTemplate(template: Template): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Basic validation
      if (!template.name || !template.body) {
        errors.push(
      }

      if (!this.config.supportedLanguages.includes(template.language)) {
        errors.push(
      }

      // Handlebars syntax validation
      try {
        this.compileHandlebarsTemplate(template);
      } catch (error) {
        errors.push(
      }

      // Variable validation
      const declaredVariables = template.variables || [];
      const usedVariables = this.extractHandlebarsVariables(template.body);
      const missingVariables = usedVariables.filter(v => !declaredVariables.includes(v));
      
      if (missingVariables.length > 0) {
        errors.push(
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        valid: false,
        errors: [
      };
    }
  }

  async getTemplate(templateId: string, language?: string): Promise<Template | null> {
    const lang = language || this.config.defaultLanguage;
    const key = 
    return this.templates.get(key) || null;
  }

  async listTemplates(type?: string, language?: string): Promise<Template[]> {
    let templates = Array.from(this.templates.values());

    if (type) {
      templates = templates.filter(t => t.type === type);
    }

    if (language) {
      templates = templates.filter(t => t.language === language);
    }

    return templates.filter(t => t.isActive);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    this.compiledTemplates.clear();
    logger.info(
  }

  private compileHandlebarsTemplate(template: Template): any {
    // Simulate Handlebars compilation
    const compiled = (context: any) => {;
      let result = template.body;
      
      // Replace variables
      for (const [key, value] of Object.entries(context)) {
        if (key.startsWith(
        
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 
        result = result.replace(regex, String(value 
      }

      // Handle conditionals {{#if variable}}...{{/if}}
      result = result.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, variable, content) => {
        return context[variable] ? content 
      });

      // Handle loops {{#each array}}...{{/each}}
      result = result.replace(/\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs, (match, variable, content) => {
        const array = context[variable];
        if (!Array.isArray(array)) return 
        
        return array.map((item, index) => {
          let itemContent = content;/;
          itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
          
          if (typeof item 
            for (const [key, value] of Object.entries(item)) {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 
              itemContent = itemContent.replace(regex, String(value 
            }
          }
          
          return itemContent;
        }).join(
      });

      return result;
    };

    return compiled;
  }

  private extractHandlebarsVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract simple variables {{variable}}
    const simpleMatches = template.match(/\{\{(\w+)\}\}/g);
    if (simpleMatches) {
      simpleMatches.forEach(match => {
        const variable = match.replace(/\{\{|\}\}/g, 
        variables.add(variable);
      });
    }

    // Extract conditional variables {{#if variable}}
    const conditionalMatches = template.match(/\{\{#if\s+(\w+)\}\}/g);
    if (conditionalMatches) {
      conditionalMatches.forEach(match => {
        const variable = match.replace(/\{\{#if\s+|\}\}/g, 
        variables.add(variable);
      });
    }

    // Extract loop variables {{#each array}}
    const loopMatches = template.match(/\{\{#each\s+(\w+)\}\}/g);
    if (loopMatches) {
      loopMatches.forEach(match => {
        const variable = match.replace(/\{\{#each\s+|\}\}/g, 
        variables.add(variable);
      });
    }

    return Array.from(variables);
  }

  private generateCacheKey(request: TemplateRenderRequest): string {
    const variablesHash = JSON.stringify(request.variables);
    const contextHash = JSON.stringify(request.context || {});
    return 
  }

  private cleanupCache(): void {
    if (this.cache.size > this.config.cacheSize) {
      const entries = Array.from(this.cache.entries());
      const toDelete = entries.slice(0, entries.length - this.config.cacheSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<Template, 'id' | 'createdAt' | 
      {
        name
        description
        type
        language
        subject
        body
        variables: ['app_name', 
        isActive: true,
        version: 1
      },
      {
        name
        description
        type
        language
        subject
        body: 'Hi {{user_name}}, welcome to {{app_name}}! We\
        variables: ['app_name', 
        isActive: true,
        version: 1
      },
      {
        name
        description
        type
        language
        subject
        body
        variables: ['user_name', 
        isActive: true,
        version: 1
      },
      {
        name
        description
        type
        language
        body
        variables: [
        isActive: true,
        version: 1
      },
      {
        name
        description
        type
        language
        body
        variables: ['product_name', 
        isActive: true,
        version: 1
      }
    ];

    for (const template of defaultTemplates) {
      const id = 
      const now = new Date();
      
      const newTemplate: Template = {;
        ...template,
        id,
        createdAt: now,
        updatedAt: now
      };

      const key = 
      this.templates.set(key, newTemplate);
    }
  }
}

// ============================================================================
// MUSTACHE ENGINE
// =========================================================================
export class MustacheEngine implements ITemplateEngine {;
  private config: TemplateEngineConfig;
  private templates: Map<string, Template> = new Map();
  private cache: Map<string, TemplateRenderResult> = new Map();

  constructor(config: TemplateEngineConfig) {
    this.config = config;
    this.initializeDefaultTemplates();
  }

  async render(request: TemplateRenderRequest): Promise<TemplateRenderResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    try {
      // Check cache first
      if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true,
            renderTime: Date.now() - startTime
          }
        };
      }

      // Get template
      const template = await this.getTemplate(request.templateId, request.language);
      if (!template) {
        throw new Error(
      }

      // Prepare context
      const context = {;
        ...request.variables,
        ...request.context
      };

      // Render template using Mustache syntax
      const renderedBody = this.renderMustacheTemplate(template.body, context);
      const renderedSubject = template.subject ? this.renderMustacheTemplate(template.subject, context) : undefined;

      const result: TemplateRenderResult = {;
        subject: renderedSubject,
        body: renderedBody,
        language: template.language,
        templateId: template.id,
        variables: request.variables,
        metadata: {
          engine
          renderTime: Date.now() - startTime,
          cacheHit: false,
          warnings: []
        }
      };

      // Cache result
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, result);
        this.cleanupCache();
      }

      return result;

    } catch (error) {
      logger.error(
        templateId: request.templateId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async validateTemplate(template: Template): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Basic validation
      if (!template.name || !template.body) {
        errors.push(
      }

      if (!this.config.supportedLanguages.includes(template.language)) {
        errors.push(
      }

      // Mustache syntax validation
      try {
        this.renderMustacheTemplate(template.body, {});
      } catch (error) {
        errors.push(
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        valid: false,
        errors: [
      };
    }
  }

  async getTemplate(templateId: string, language?: string): Promise<Template | null> {
    const lang = language || this.config.defaultLanguage;
    const key = 
    return this.templates.get(key) || null;
  }

  async listTemplates(type?: string, language?: string): Promise<Template[]> {
    let templates = Array.from(this.templates.values());

    if (type) {
      templates = templates.filter(t => t.type === type);
    }

    if (language) {
      templates = templates.filter(t => t.language === language);
    }

    return templates.filter(t => t.isActive);
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    logger.info(
  }

  private renderMustacheTemplate(template: string, context: any): string {
    let result = template;

    // Replace simple variables {{variable}}
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 
      result = result.replace(regex, String(value 
    }

    // Handle conditionals {{#variable}}...{{/variable}}
    result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, variable, content) => {
      return context[variable] ? content 
    });

    // Handle inverted conditionals {{^variable}}...{{/variable}}
    result = result.replace(/\{\{\^(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, variable, content) => {
      return !context[variable] ? content 
    });

    // Handle loops {{#array}}...{{/array}}
    result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, variable, content) => {
      const array = context[variable];
      if (!Array.isArray(array)) return 
      
      return array.map((item, index) => {
        let itemContent = content;/;
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
        itemContent = itemContent.replace(/\{\{\.\}\}/g, String(item));
        
        if (typeof item 
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 
            itemContent = itemContent.replace(regex, String(value 
          }
        }
        
        return itemContent;
      }).join(
    });

    return result;
  }

  private generateCacheKey(request: TemplateRenderRequest): string {
    const variablesHash = JSON.stringify(request.variables);
    const contextHash = JSON.stringify(request.context || {});
    return 
  }

  private cleanupCache(): void {
    if (this.cache.size > this.config.cacheSize) {
      const entries = Array.from(this.cache.entries());
      const toDelete = entries.slice(0, entries.length - this.config.cacheSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  private initializeDefaultTemplates(): void {
    // Same as HandlebarsEngine but with Mustache syntax
    const defaultTemplates: Omit<Template, 'id' | 'createdAt' | 
      {
        name
        description
        type
        language
        subject
        body
        variables: ['app_name', 
        isActive: true,
        version: 1
      }
    ];

    for (const template of defaultTemplates) {
      const id = 
      const now = new Date();
      
      const newTemplate: Template = {;
        ...template,
        id,
        createdAt: now,
        updatedAt: now
      };

      const key = 
      this.templates.set(key, newTemplate);
    }
  }
}

// ============================================================================
// TEMPLATE ENGINE FACTORY
// =========================================================================
export class TemplateEngineFactory {;
  static create(config: TemplateEngineConfig): ITemplateEngine {
    switch (config.engine) {
      case 
        return new HandlebarsEngine(config);
      case 
        return new MustacheEngine(config);
      default
        throw new Error(
    }
  }
}

// ============================================================================
// EXPORTS
// =========================================================================
export {;
  TemplateEngineConfigSchema,
  TemplateSchema,
  TemplateRenderRequestSchema
};
