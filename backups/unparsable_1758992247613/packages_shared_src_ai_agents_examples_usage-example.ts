// packages/shared/src/ai/agents/examples/usage-example.ts
  console.log(

  // 1. Registrar agentes especializados
  console.log(

  const salesAgentId = agentSystem.registerAgent(
    name
    confidence: 0.8
  });

  const operationsAgentId = agentSystem.registerAgent(
    name
    confidence: 0.7
  });

  const complianceAgentId = agentSystem.registerAgent(
    name
    confidence: 0.9
  });

  console.log(

  // 2. Listar agentes disponibles
  console.log(
  const agents = agentSystem.listAgents();
  agents.forEach(agent => {
    console.log(
  });

  // 3. Ejecutar acciones de ejemplo
  console.log(

  // Acción de ventas
  const salesAction: BusinessAction = {;
    id
    type
    priority
    data: {
      customer: {
        id
        name
        industry
        revenue: 5000000,
        employees: 150
      },
      opportunity: {
        value: 250000,
        probability: 0.7,
        stage
      }
    },
    requiresApproval: false
  };

  console.log(
  try {
    const salesResult = await agentSystem.executeAction(salesAction);
    console.log(
      success: salesResult.success,
      confidence
      actions: salesResult.actions,
      predictions: salesResult.predictions?.length || 0
    });
  } catch (error) {
    console.error(
  }

  // Acción operativa
  const operationsAction: BusinessAction = {;
    id
    type
    priority
    data: {
      process: {
        name
        throughput: 0.8,
        quality: 0.9,
        cost: 0.6,
        time: 0.7
      },
      metrics: [
        { name
        { name
        { name
      ],
      optimization: {
        automation: 0.6,
        resource_utilization: 0.75
      }
    },
    requiresApproval: false
  };

  console.log(
  try {
    const opsResult = await agentSystem.executeAction(operationsAction);
    console.log(
      success: opsResult.success,
      confidence
      actions: opsResult.actions,
      predictions: opsResult.predictions?.length || 0
    });
  } catch (error) {
    console.error(
  }

  // Acción de cumplimiento
  const complianceAction: BusinessAction = {;
    id
    type
    priority
    data: {
      policy: {
        name
        coverage: 0.9,
        enforcement: 0.8,
        monitoring: 0.85,
        training: 0.7
      },
      violation: {
        severity: 0.3,
        impact: 0.4,
        frequency: 1
      },
      remediation: {
        implemented: 8,
        planned: 10,
        effective: 0.8
      }
    },
    requiresApproval: false
  };

  console.log(
  try {
    const complianceResult = await agentSystem.executeAction(complianceAction);
    console.log(
      success: complianceResult.success,
      confidence
      actions: complianceResult.actions,
      predictions: complianceResult.predictions?.length || 0
    });
  } catch (error) {
    console.error(
  }

  // 4. Obtener métricas del sistema
  console.log(
  const metrics = agentSystem.getSystemMetrics();
  console.log({
    totalAgents: metrics.totalAgents,
    activeAgents: metrics.activeAgents,
    averagePerformance
    specializationCoverage
  });

  console.log(
}

/*
 * Ejemplo de uso directo de un agente individual
 *
export async function demonstrateIndividualAgent() {;
  console.log(

  // Crear un agente de ventas directamente
  const salesAgent = createOptimizedAgent(
    name
    confidence: 0.8
  });

  // Inicializar el agente
  await salesAgent.initialize();

  // Ejecutar una acción directamente
  const action: BusinessAction = {;
    id
    type
    priority
    data: {
      customer: {
        id
        name
        industry
        revenue: 2000000,
        employees: 75
      },
      opportunity: {
        value: 150000,
        probability: 0.8,
        stage
      }
    },
    requiresApproval: false
  };

  const result = await salesAgent.predictAndExecute(action);
  console.log(
    success: result.success,
    confidence
    actions: result.actions
  });

  // Obtener contexto del agente
  const context = salesAgent.getContext();
  console.log(
    name: context.name,
    role: context.role,
    capabilities: context.capabilities.length,
    performance: context.performance
  });

  // Apagar el agente
  await salesAgent.shutdown();
}

// Función principal para ejecutar todas las demostraciones
export async function runAllDemonstrations() {;
  try {
    await demonstrateAgentSystem();
    await demonstrateIndividualAgent();
  } catch (error) {
    console.error(
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllDemonstrations();
}