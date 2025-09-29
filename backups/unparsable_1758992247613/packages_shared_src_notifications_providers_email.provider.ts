// ============================================================================
// EMAIL PROVIDER - SENDGRID, AWS SES, SMTP
// =========================================================================
  provider: z.enum(['sendgrid', 'aws_ses', 
  apiKey: z.string().optional(),
  secretKey: z.string().optional(),
  region: z.string().optional(),
  host: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  replyTo: z.string().email().optional(),
  testMode: z.boolean().default(false)
});

const EmailMessageSchema = z.object({;
  to: z.array(z.string().email()),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    type: z.string().optional(),
    disposition: z.enum(['attachment', 'inline']).default(
  })).optional(),
  headers: z.record(z.string()).optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default(
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true)
});

// ============================================================================
// INTERFACES
// =========================================================================
export interface EmailProviderConfig {;
  provider: 'sendgrid' | 'aws_ses' | 
  apiKey?: string;
  secretKey?: string;
  region?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  testMode?: boolean;
}

export interface EmailMessage {;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    type?: string;
    disposition?: 'attachment' | 
  }>;
  headers?: Record<string, string>;
  templateId?: string;
  templateData?: Record<string, any>;
  priority?: 'low' | 'normal' | 
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailResult {;
  messageId: string;
  success: boolean;
  provider: string;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface IEmailProvider {;
  send(message: EmailMessage): Promise<EmailResult>;
  sendBulk(messages: EmailMessage[]): Promise<EmailResult[]>;
  validateConfig(): Promise<boolean>;
  getQuota(): Promise<{ used: number; limit: number; resetAt: Date }>;
}

// ============================================================================
// SENDGRID PROVIDER
// =========================================================================
export class SendGridProvider implements IEmailProvider {;
  private config: EmailProviderConfig;
  private apiKey: string;

  constructor(config: EmailProviderConfig) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.SENDGRID_API_KEY 
    if (!this.apiKey) {
      throw new Error(
    }
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      if (this.config.testMode) {
        logger.info(
          to: message.to,
          subject: message.subject,
          provider
        });
        
        return {
          messageId
          success: true,
          provider
          timestamp: new Date(),
          metadata: { testMode: true }
        };
      }

      // Simulate SendGrid API call
      const sendGridMessage = {;
        personalizations: [{
          to: message.to.map(email => ({ email })),
          cc: message.cc?.map(email => ({ email })),
          bcc: message.bcc?.map(email => ({ email })),
          subject: message.subject
        }],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        reply_to: message.replyTo ? { email: message.replyTo } : undefined,
        subject: message.subject,
        content: [
          ...(message.html ? [{ type
          ...(message.text ? [{ type
        ],
        attachments: message.attachments?.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: att.disposition
        })),
        headers: message.headers,
        tracking_settings: {
          open_tracking: { enable: message.trackOpens },
          click_tracking: { enable: message.trackClicks }
        }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const messageId = 

      logger.info(
        messageId,
        to: message.to,
        subject: message.subject,
        provider
      });

      return {
        messageId,
        success: true,
        provider
        timestamp: new Date(),
        metadata: { templateId: message.templateId }
      };

    } catch (error) {
      logger.error(
        error: (error as Error).message,
        to: message.to,
        subject: message.subject
      });

      return {
        messageId
        success: false,
        provider
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => this.send(message));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Simulate API key validation
      return this.apiKey.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; limit: number; resetAt: Date }> {
    // Simulate quota check
    return {
      used: Math.floor(Math.random() * 1000),
      limit: 10000,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }
}

// ============================================================================
// AWS SES PROVIDER
// =========================================================================
export class AWSSESProvider implements IEmailProvider {;
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      if (this.config.testMode) {
        logger.info(
          to: message.to,
          subject: message.subject,
          provider
        });
        
        return {
          messageId
          success: true,
          provider
          timestamp: new Date(),
          metadata: { testMode: true }
        };
      }

      // Simulate AWS SES API call
      const sesMessage = {;
        Source
        },
        Message: {
          Subject: { Data: message.subject, Charset
          Body: {
            ...(message.html ? { Html: { Data: message.html, Charset
            ...(message.text ? { Text: { Data: message.text, Charset
          }
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const messageId = 

      logger.info(
        messageId,
        to: message.to,
        subject: message.subject,
        provider
      });

      return {
        messageId,
        success: true,
        provider
        timestamp: new Date(),
        metadata: { region: this.config.region }
      };

    } catch (error) {
      logger.error(
        error: (error as Error).message,
        to: message.to,
        subject: message.subject
      });

      return {
        messageId
        success: false,
        provider
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    // Process in batches of 50 (AWS SES limit)
    const batchSize = 50;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => this.send(message));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async validateConfig(): Promise<boolean> {
    try {
      return !!(this.config.secretKey && this.config.region);
    } catch (error) {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; limit: number; resetAt: Date }> {
    // Simulate quota check
    return {
      used: Math.floor(Math.random() * 200),
      limit: 200,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }
}

// ============================================================================
// SMTP PROVIDER
// =========================================================================
export class SMTPProvider implements IEmailProvider {;
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      if (this.config.testMode) {
        logger.info(
          to: message.to,
          subject: message.subject,
          provider
        });
        
        return {
          messageId
          success: true,
          provider
          timestamp: new Date(),
          metadata: { testMode: true }
        };
      }

      // Simulate SMTP connection and send
      const smtpMessage = {;
        from
      };

      // Simulate SMTP delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const messageId = 

      logger.info(
        messageId,
        to: message.to,
        subject: message.subject,
        provider
      });

      return {
        messageId,
        success: true,
        provider
        timestamp: new Date(),
        metadata: { host: this.config.host }
      };

    } catch (error) {
      logger.error(
        error: (error as Error).message,
        to: message.to,
        subject: message.subject
      });

      return {
        messageId
        success: false,
        provider
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }

  async sendBulk(messages: EmailMessage[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    // Process sequentially for SMTP
    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }

  async validateConfig(): Promise<boolean> {
    try {
      return !!(this.config.host && this.config.port);
    } catch (error) {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; limit: number; resetAt: Date }> {
    // SMTP doesn
    return {
      used: 0,
      limit: Infinity,
      resetAt: new Date()
    };
  }
}

// ============================================================================
// EMAIL PROVIDER FACTORY
// =========================================================================
export class EmailProviderFactory {;
  static create(config: EmailProviderConfig): IEmailProvider {
    switch (config.provider) {
      case 
        return new SendGridProvider(config);
      case 
        return new AWSSESProvider(config);
      case 
        return new SMTPProvider(config);
      default
        throw new Error(
    }
  }
}

// ============================================================================
// EXPORTS
// =========================================================================
export {;
  EmailProviderConfigSchema,
  EmailMessageSchema
};
