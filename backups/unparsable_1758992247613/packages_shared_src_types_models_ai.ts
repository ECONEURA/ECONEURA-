
  finishReason?: 'stop' | 'length' | 'function_call' | 
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIUsage {;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

// AI Model types
export interface AIModel extends BaseEntity {;
  provider: 'openai' | 'azure' | 'anthropic' | 
  model: string;
  capabilities: string[];
  maxTokens: number;
  pricing: {
    inputTokens: number;
    outputTokens: number;
    currency: string;
  };
  status: 'active' | 'deprecated' | 
  metadata?: Record<string, unknown>;
}
