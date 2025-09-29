// packages/shared/src/ai/agents/specialized/index.ts
    case 
      return new SalesAgent(context);
    case 
      return new OperationsAgent(context);
    case 
      return new ComplianceAgent(context);
    default
      throw new Error(
  }
}

// Configuraciones por defecto para cada tipo de agente
export const AGENT_CONFIGURATIONS = {;
  sales: {
    capabilities: [
      
      
      
      
      
    ],
    specializationScore: 0.9,
    learningRate: 0.1
  },
  operations: {
    capabilities: [
      
      
      
      
      
    ],
    specializationScore: 0.85,
    learningRate: 0.08
  },
  compliance: {
    capabilities: [
      
      
      
      
      
    ],
    specializationScore: 0.95,
    learningRate: 0.05
  }
} as const;