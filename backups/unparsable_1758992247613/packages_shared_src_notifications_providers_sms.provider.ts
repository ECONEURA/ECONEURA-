// ============================================================================
// SMS PROVIDER - TWILIO, AWS SNS, VONAGE
// =========================================================================
  provider: z.enum(['twilio', 'aws_sns', 
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  region: z.string().optional(),
  fromNumber: z.string(),
  testMode: z.boolean().default(false)
});

const SMSMessageSchema = z.object({;
  to: z.string(),
  message: z.string().max(1600), // SMS character limit
  mediaUrl: z.array(z.string().url()).optional(),
  statusCallback: z.string().url().optional(),
  maxPrice: z.number().optional(),
  provideFeedback: z.boolean().default(false),
  validityPeriod: z.number().min(1).max(1440).optional(), // minutes
  scheduleTime: z.date().optional()
});

// ============================================================================
// INTERFACES
// =========================================================================
export interface SMSProviderConfig {;
  provider: 'twilio' | 'aws_sns' | 
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
  region?: string;
  fromNumber: string;
  testMode?: boolean;
}

export interface SMSMessage {;
  to: string;
  message: string;
  mediaUrl?: string[];
  statusCallback?: string;
  maxPrice?: number;
  provideFeedback?: boolean;
  validityPeriod?: number;
  scheduleTime?: Date;
}

export interface SMSResult {;
  messageId: string;
  success: boolean;
  provider: string;
  timestamp: Date;
  error?: string;
  metadata?: {
    price?: string;
    currency?: string;
    segments?: number;
    status?: string;
  };
}

export interface ISMSProvider {;
  send(message: SMSMessage): Promise<SMSResult>;
  sendBulk(messages: SMSMessage[]): Promise<SMSResult[]>;
  validateConfig(): Promise<boolean>;
  getQuota(): Promise<{ used: number; limit: number; resetAt: Date }>;
  getMessageStatus(messageId: string): Promise<{ status: string; errorCode?: string }>;
}

// ============================================================================
// TWILIO PROVIDER
// =========================================================================
export class TwilioProvider implements ISMSProvider {;
  private config: SMSProviderConfig;
  private accountSid: string;
  private authToken: string;

  constructor(config: SMSProviderConfig) {
    this.config = config;
    this.accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID 
    this.authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN 
    if (!this.accountSid || !this.authToken) {
      throw new Error(
    }
  }

  async send(message: SMSMessage): Promise<SMSResult> {
    try {
      if (this.config.testMode) {
        logger.info(
          to: message.to,
          message: message.message.substring(0, 50) 
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

      // Simulate Twilio API call
      const twilioMessage = {;
        To: message.to,
        From: this.config.fromNumber,
        Body: message.message,
        MediaUrl: message.mediaUrl,
        StatusCallback: message.statusCallback,
        MaxPrice: message.maxPrice,
        ProvideFeedback: message.provideFeedback,
        ValidityPeriod: message.validityPeriod,
        ScheduleType: message.scheduleTime 
        SendAt: message.scheduleTime?.toISOString()
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const messageId = 

      logger.info(
        messageId,
        to: message.to,
        provider
      });

      return {
        messageId,
        success: true,
        provider
        timestamp: new Date(),
        metadata: {
          price
          currency
          segments: Math.ceil(message.message.length / 160),
          status
        }
      };

    } catch (error) {
      logger.error(
        error: (error as Error).message,
        to: message.to
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

  async sendBulk(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];
    
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
      return !!(this.accountSid && this.authToken);
    } catch (error) {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; limit: number; resetAt: Date }> {
    // Simulate quota check
    return {
      used: Math.floor(Math.random() * 100),
      limit: 1000,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  async getMessageStatus(messageId: string): Promise<{ status: string; errorCode?: string }> {
    // Simulate status check
    const statuses = ['queued', 'sent', 'delivered', 'failed', 
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status,
      errorCode: status === 'failed' 
    };
  }
}

// ============================================================================
// AWS SNS PROVIDER
// =========================================================================
export class AWSSNSProvider implements ISMSProvider {;
  private config: SMSProviderConfig;

  constructor(config: SMSProviderConfig) {
    this.config = config;
  }

  async send(message: SMSMessage): Promise<SMSResult> {
    try {
      if (this.config.testMode) {
        logger.info(
          to: message.to,
          message: message.message.substring(0, 50) 
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

      // Simulate AWS SNS API call
      const snsMessage = {;
        PhoneNumber: message.to,
        Message: message.message,
        MessageAttributes: {
          
            DataType
            StringValue
          },
          
            DataType
            StringValue: message.maxPrice.toString()
          } : undefined
        }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const messageId = 

      logger.info(
        messageId,
        to: message.to,
        provider
      });

      return {
        messageId,
        success: true,
        provider
        timestamp: new Date(),
        metadata: {
          price
          currency
          segments: Math.ceil(message.message.length / 160),
          status
        }
      };

    } catch (error) {
      logger.error(
        error: (error as Error).message,
        to: message.to
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

  async sendBulk(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];
    
    // Process in batches of 20
    const batchSize = 20;
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
      return !!(this.config.apiKey && this.config.apiSecret && this.config.region);
    } catch (error) {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; limit: number; resetAt: Date }> {
    // Simulate quota check
    return {
      used: Math.floor(Math.random() * 50),
      limit: 200,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  async getMessageStatus(messageId: string): Promise<{ status: string; errorCode?: string }> {
    // Simulate status check
    const statuses = ['sent', 'delivered', 
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status,
      errorCode: status === 'failed' 
    };
  }
}

// ============================================================================
// VONAGE PROVIDER
// =========================================================================
export class VonageProvider implements ISMSProvider {;
  private config: SMSProviderConfig;
  private apiKey: string;
  private apiSecret: string;

  constructor(config: SMSProviderConfig) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.VONAGE_API_KEY 
    this.apiSecret = config.apiSecret || process.env.VONAGE_API_SECRET 
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
    }
  }

  async send(message: SMSMessage): Promise<SMSResult> {
    try {
      if (this.config.testMode) {
        logger.info(
          to: message.to,
          message: message.message.substring(0, 50) 
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

      // Simulate Vonage API call
      const vonageMessage = {;
        from: this.config.fromNumber,
        to: message.to,
        text: message.message,
        type
        status_report_req: message.provideFeedback,
        callback: message.statusCallback,
        ttl: message.validityPeriod ? message.validityPeriod * 60 : undefined // convert to seconds
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 120));

      const messageId = 

      logger.info(
        messageId,
        to: message.to,
        provider
      });

      return {
        messageId,
        success: true,
        provider
        timestamp: new Date(),
        metadata: {
          price
          currency
          segments: Math.ceil(message.message.length / 160),
          status
        }
      };

    } catch (error) {
      logger.error(
        error: (error as Error).message,
        to: message.to
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

  async sendBulk(messages: SMSMessage[]): Promise<SMSResult[]> {
    const results: SMSResult[] = [];
    
    // Process in batches of 15
    const batchSize = 15;
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
      return !!(this.apiKey && this.apiSecret);
    } catch (error) {
      return false;
    }
  }

  async getQuota(): Promise<{ used: number; limit: number; resetAt: Date }> {
    // Simulate quota check
    return {
      used: Math.floor(Math.random() * 75),
      limit: 500,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  async getMessageStatus(messageId: string): Promise<{ status: string; errorCode?: string }> {
    // Simulate status check
    const statuses = ['accepted', 'delivered', 'failed', 
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status,
      errorCode: status === 'failed' 
    };
  }
}

// ============================================================================
// SMS PROVIDER FACTORY
// =========================================================================
export class SMSProviderFactory {;
  static create(config: SMSProviderConfig): ISMSProvider {
    switch (config.provider) {
      case 
        return new TwilioProvider(config);
      case 
        return new AWSSNSProvider(config);
      case 
        return new VonageProvider(config);
      default
        throw new Error(
    }
  }
}

// ============================================================================
// EXPORTS
// =========================================================================
export {;
  SMSProviderConfigSchema,
  SMSMessageSchema
};
