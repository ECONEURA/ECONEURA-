
  autonomyLevel: 'supervised' | 'semi-autonomous' | 
  confidenceThreshold: number;
  riskTolerance: 'low' | 'medium' | 
}

export interface DecisionContext {;
  action: BusinessAction;
  prediction: any;
  autonomyLevel: 'supervised' | 'semi-autonomous' | 
  historicalSuccessRate?: number;
  businessImpact?: 'low' | 'medium' | 'high' | 
  complianceRequirements?: string[];
  stakeholderApproval?: boolean;
}

export interface DecisionResult {;
  canExecute: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 
  reasoning: string[];
  requiredApprovals: string[];
  alternatives: DecisionAlternative[];
}

export interface DecisionAlternative {;
  action: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 
  description: string;
}

/*
 * Motor de Decisiones Inteligente para Agentes IA
 * Evalúa cuándo un agente puede ejecutar acciones autónomamente
 *
export class DecisionEngine {;
  private config: DecisionConfig;
  private decisionHistory: DecisionRecord[] = [];
  private riskModels: Map<string, RiskModel> = new Map();

  constructor(config: DecisionConfig) {
    this.config = config;
    this.initializeRiskModels();
  }

  /*
   * Evalúa si una acción puede ejecutarse autónomamente
   *
  async evaluate(context: DecisionContext): Promise<boolean> {
    const decision = await this.makeDecision(context);

    // Registrar la decisión para aprendizaje
    this.recordDecision(context, decision);

    return decision.canExecute;
  }

  /*
   * Toma una decisión completa sobre una acción
   *
  async makeDecision(context: DecisionContext): Promise<DecisionResult> {
    const reasoning: string[] = [];
    const requiredApprovals: string[] = [];

    // 1. Evaluar confianza de la predicción
    const predictionConfidence = this.evaluatePredictionConfidence(context.prediction);
    reasoning.push(

    // 2. Evaluar nivel de autonomía
    const autonomyScore = this.evaluateAutonomyLevel(context.autonomyLevel);
    reasoning.push(

    // 3. Evaluar riesgo de la acción
    const riskAssessment = await this.assessRisk(context);
    reasoning.push(

    // 4. Evaluar impacto en el negocio
    const businessImpact = this.evaluateBusinessImpact(context);
    reasoning.push(

    // 5. Verificar requisitos de compliance
    const complianceCheck = this.checkComplianceRequirements(context);
    if (!complianceCheck.compliant) {
      requiredApprovals.push(...complianceCheck.requiredApprovals);
      reasoning.push(
    }

    // 6. Evaluar aprobaciones de stakeholders
    if (context.stakeholderApproval === false) {
      requiredApprovals.push(
      reasoning.push(
    }

    // 7. Calcular decisión final
    const finalConfidence = this.calculateFinalConfidence({;
      predictionConfidence,
      autonomyScore,
      riskAssessment,
      businessImpact,
      complianceCheck
    });

    const canExecute = this.determineExecutionPermission({;
      finalConfidence,
      riskAssessment,
      requiredApprovals,
      businessImpact
    });

    // 8. Generar alternativas
    const alternatives = this.generateAlternatives(context, riskAssessment);

    const decision: DecisionResult = {;
      canExecute,
      confidence: finalConfidence,
      riskLevel: riskAssessment.level,
      reasoning,
      requiredApprovals,
      alternatives
    };

    return decision;
  }

  /*
   * Obtiene métricas de rendimiento del motor de decisiones
   *
  getMetrics(): Record<string, any> {
    const totalDecisions = this.decisionHistory.length;
    const autonomousDecisions = this.decisionHistory.filter(d => d.result.canExecute).length;
    const highRiskDecisions = this.decisionHistory.filter(d => d.result.riskLevel 
    const accuracy = totalDecisions > 0 ?/;
      this.decisionHistory.filter(d => d.wasCorrect !== undefined && d.wasCorrect).length / totalDecisions : 0;

    return {
      totalDecisions,
      autonomousDecisions,
      autonomyRate: totalDecisions > 0 ? autonomousDecisions / totalDecisions : 0,
      highRiskDecisions,
      accuracy,
      riskDistribution: this.calculateRiskDistribution(),
      decisionTrends: this.analyzeDecisionTrends()
    };
  }

  /*
   * Actualiza el resultado de una decisión previa (para aprendizaje)
   *
  updateDecisionOutcome(decisionId: string, wasCorrect: boolean, actualOutcome?: any): void {
    const decision = this.decisionHistory.find(d => d.id === decisionId);
    if (decision) {
      decision.wasCorrect = wasCorrect;
      decision.actualOutcome = actualOutcome;
      this.updateRiskModels(decision);
    }
  }

  private evaluatePredictionConfidence(prediction: any): number {
    if (!prediction || typeof prediction.confidence 
      return 0.5; // Confianza neutral por defecto
    }

    // Ajustar confianza basada en factores adicionales
    let adjustedConfidence = prediction.confidence;

    // Penalizar si hay incertidumbre alta
    if (prediction.uncertainty && prediction.uncertainty > 0.3) {
      adjustedConfidence *= 0.8;
    }

    // Bonus por consistencia histórica
    if (prediction.historicalAccuracy && prediction.historicalAccuracy > 0.8) {
      adjustedConfidence *= 1.1;
    }

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  private evaluateAutonomyLevel(level: 'supervised' | 'semi-autonomous' | 
    const scores = {;
      
      
      
    };

    return scores[level] || 0.5;
  }

  private async assessRisk(context: DecisionContext): Promise<RiskAssessment> {
    const riskModel = this.riskModels.get(context.action.type) || this.riskModels.get(

    const riskScore = await riskModel.calculateRisk(context);
    const riskLevel = this.classifyRiskLevel(riskScore);

    return {
      score: riskScore,
      level: riskLevel,
      factors: riskModel.getRiskFactors(context)
    };
  }

  private evaluateBusinessImpact(context: DecisionContext): 'low' | 'medium' | 'high' | 
    // Evaluar impacto basado en el tipo de acción y datos
    const actionType = context.action.type;
    const data = context.action.data;

    if (actionType.includes('delete') || actionType.includes(
      return 
    }

    if (actionType.includes(
      return 
    }

    if (actionType.includes('user') || actionType.includes(
      return 
    }

    return 
  }

  private checkComplianceRequirements(context: DecisionContext): ComplianceCheck {
    const requirements = context.complianceRequirements || [];
    const requiredApprovals: string[] = [];

    let compliant = true;
    const reasoning: string[] = [];

    for (const requirement of requirements) {
      switch (requirement) {
        case 
          if (context.action.data.personalData) {
            requiredApprovals.push(
            reasoning.push(
            compliant = false;
          }
          break;

        case 
          if (context.action.data.paymentInfo) {
            requiredApprovals.push(
            reasoning.push(
            compliant = false;
          }
          break;

        case 
          if (context.businessImpact 
            requiredApprovals.push(
            reasoning.push(
            compliant = false;
          }
          break;
      }
    }

    return {
      compliant,
      requiredApprovals,
      reasoning: reasoning.join(
    };
  }

  private calculateFinalConfidence(factors: {
    predictionConfidence: number;
    autonomyScore: number;
    riskAssessment: RiskAssessment;
    businessImpact: string;
    complianceCheck: ComplianceCheck;
  }): number {
    let confidence = factors.predictionConfidence;

    // Aplicar multiplicadores
    confidence *= factors.autonomyScore;

    // Penalizar por riesgo alto
    if (factors.riskAssessment.level 
      confidence *= 0.7;
    } else if (factors.riskAssessment.level 
      confidence *= 0.5;
    }

    // Penalizar por impacto crítico
    if (factors.businessImpact 
      confidence *= 0.8;
    }

    // Penalizar por no cumplimiento
    if (!factors.complianceCheck.compliant) {
      confidence *= 0.6;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private determineExecutionPermission(params: {
    finalConfidence: number;
    riskAssessment: RiskAssessment;
    requiredApprovals: string[];
    businessImpact: string;
  }): boolean {
    // No ejecutar si hay aprobaciones requeridas
    if (params.requiredApprovals.length > 0) {
      return false;
    }

    // No ejecutar si el riesgo es crítico
    if (params.riskAssessment.level 
      return false;
    }

    // Verificar umbral de confianza
    if (params.finalConfidence < this.config.confidenceThreshold) {
      return false;
    }

    // Verificar tolerancia al riesgo
    if (this.config.riskTolerance === 'low' && params.riskAssessment.level 
      return false;
    }

    return true;
  }

  private generateAlternatives(context: DecisionContext, riskAssessment: RiskAssessment): DecisionAlternative[] {
    const alternatives: DecisionAlternative[] = [];

    // Alternativa conservadora
    alternatives.push({
      action
      confidence: 1.0,
      riskLevel
      description
    });

    // Alternativa con monitoreo
    if (riskAssessment.level 
      alternatives.push({
        action
        confidence: 0.9,
        riskLevel
        description
      });
    }

    // Alternativa de ejecución parcial
    if (context.action.data.partialExecution) {
      alternatives.push({
        action
        confidence: 0.7,
        riskLevel
        description
      });
    }

    return alternatives;
  }

  private recordDecision(context: DecisionContext, result: DecisionResult): void {
    const record: DecisionRecord = {;
      id
      timestamp: new Date(),
      context,
      result,
      wasCorrect: undefined,
      actualOutcome: undefined
    };

    this.decisionHistory.push(record);

    // Mantener límite de historial
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory = this.decisionHistory.slice(-500);
    }
  }

  private initializeRiskModels(): void {
    // Modelo de riesgo por defecto
    this.riskModels.set(

    // Modelos específicos por tipo de acción
    this.riskModels.set(
    this.riskModels.set(
    this.riskModels.set(
  }

  private classifyRiskLevel(score: number): 'low' | 'medium' | 'high' | 
    if (score >= 0.8) return 
    if (score >= 0.6) return 
    if (score >= 0.4) return 
    return 
  }

  private calculateRiskDistribution(): Record<string, number> {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

    this.decisionHistory.forEach(decision => {
      distribution[decision.result.riskLevel]++;
    });

    return distribution;
  }

  private analyzeDecisionTrends(): any[] {
    // Análisis básico de tendencias
    const recentDecisions = this.decisionHistory.slice(-50);
    const trends = [];

    if (recentDecisions.length >= 10) {
      const recentAutonomous = recentDecisions.filter(d => d.result.canExecute).length;/;
      const autonomyTrend = recentAutonomous / recentDecisions.length;

      trends.push({
        type
        value: autonomyTrend,
        period
      });
    }

    return trends;
  }

  private updateRiskModels(decision: DecisionRecord): void {
    if (decision.wasCorrect !== undefined) {
      const riskModel = this.riskModels.get(decision.context.action.type) || this.riskModels.get(
      riskModel.updateFromDecision(decision);
    }
  }
}

interface DecisionRecord {
  id: string;
  timestamp: Date;
  context: DecisionContext;
  result: DecisionResult;
  wasCorrect?: boolean;
  actualOutcome?: any;
}

interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 
  factors: string[];
}

interface ComplianceCheck {
  compliant: boolean;
  requiredApprovals: string[];
  reasoning: string;
}

// Modelos de riesgo especializados
abstract class RiskModel {
  abstract calculateRisk(context: DecisionContext): Promise<number>;
  abstract getRiskFactors(context: DecisionContext): string[];
  abstract updateFromDecision(decision: DecisionRecord): void;
}

class DefaultRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    // Cálculo básico de riesgo por defecto
    let risk = 0.3; // Riesgo base;

    if (context.businessImpact 
    else if (context.businessImpact 
    else if (context.businessImpact 
    if (context.prediction?.confidence < 0.7) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['business-impact', 
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Implementación básica de actualización
  }
}

class FinancialRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    let risk = 0.5; // Riesgo más alto para operaciones financieras;

    const amount = context.action.data.amount || 0;
    if (amount > 100000) risk += 0.4;
    else if (amount > 10000) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['transaction-amount', 'financial-impact', 
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Actualización específica para operaciones financieras
  }
}

class UserDataRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    let risk = 0.4; // Riesgo moderado para datos de usuario;

    if (context.action.data.sensitiveData) risk += 0.3;
    if (context.complianceRequirements?.includes(

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['data-sensitivity', 'gdpr-compliance', 
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Actualización específica para operaciones con datos de usuario
  }
}

class SystemConfigRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    let risk = 0.6; // Riesgo alto para configuración del sistema;

    if (context.action.data.systemCritical) risk += 0.3;
    if (context.action.data.rollbackAvailable === false) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['system-criticality', 'rollback-availability', 
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Actualización específica para operaciones de configuración
  }
}