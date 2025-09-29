


  
  
  
  
  
  
  
  
  
])

export type StepType = z.infer<typeof StepTypeSchema>;

// Step status
export const StepStatusSchema = z.enum([;
  
  
  
  
  
  
])

export type StepStatus = z.infer<typeof StepStatusSchema>;

// Step result
export interface StepResult {;
  success: boolean
  data?: any
  error?: string
  compensationRequired?: boolean
  metadata?: Record<string, any
}

// Step definition
export interface StepDefinition {;
  id: string
  type: StepType
  name: string
  description?: string
  config: Record<string, any
  conditions?: Condition[]
  compensation?: CompensationStep
  timeout?: number
  retries?: number
  dependsOn?: string[]
}

// Condition definition
export interface Condition {;
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 
  value: any
}

// Compensation step
export interface CompensationStep {;
  type: StepType
  config: Record<string, any
  description: string
}

// Playbook definition
export interface PlaybookDefinition {;
  id: string
  name: string
  description: string
  version: string
  steps: StepDefinition[]
  variables?: Record<string, any
  timeout?: number
  maxRetries?: number
}

// Playbook execution context
export interface PlaybookContext {;
  orgId: string
  userId: string
  requestId: string
  variables: Record<string, any
  stepResults: Map<string, StepResult
  auditTrail: AuditEvent[]
}

// Audit event
export interface AuditEvent {;
  timestamp: Date
  stepId: string
  action: string
  status: StepStatus
  data?: any
  error?: string
  metadata?: Record<string, any
}

// Playbook executor
export class PlaybookExecutor {;
  private tracer = { startSpan: (name: string) => {
    // support different otel module shapes and test mocks
  const ot: unknown = otel as unknown;
  const maybeCreateSpan = (ot as { createSpan?: (n: string) => any }).createSpan;
  if (typeof maybeCreateSpan 
  const maybeCreateTracer = (ot as { createTracer?: () => { startSpan: (n: string) => any } }).createTracer;
  if (typeof maybeCreateTracer 
    // fallback minimal span
    return {
      setAttribute: (_k?: string, _v?: any) => {},
      setAttributes: (_attrs?: Record<string, any>) => {},
      recordException: (_err?: any) => {},
      setStatus: (_s?: any) => {},
      end: () => {}
    }
  } }
  private context: PlaybookContext
  private definition: PlaybookDefinition

  constructor(definition: PlaybookDefinition, context: PlaybookContext) {
    this.definition = definition
    this.context = context
  }

  /*
   * Execute the playbook
   *
  async execute(): Promise<{
    success: boolean
    results: Map<string, StepResult
    auditTrail: AuditEvent[]
  }> {
    const span = this.tracer.startSpan(

    try {
      span.setAttributes({
        
        
        
        
        
      })

      logger.info(
  playbook_id: this.definition.id,
  playbook_name: this.definition.name,
  org_id: this.context.orgId,
  actor: this.context.userId,
  x_request_id: this.context.requestId
      })

      // Execute steps in order
      for (const step of this.definition.steps) {
        await this.executeStep(step)
      }

      // Check if any compensation is needed
      const failedSteps = Array.from(this.context.stepResults.entries());
        .filter(([_, result]) => !result.success && result.compensationRequired)

      if (failedSteps.length > 0) {
        await this.executeCompensations(failedSteps)
      }

  // Consider a playbook successful only if every defined step has a successful result
  const success = this.definition.steps.every(step => this.context.stepResults.get(step.id)?.success === true);

  // debug: log final step results and computed success
  // eslint-disable-next-line no-console
  console.debug('[playbook] final success:', success, 

      logger.info(
        playbook_id: this.definition.id,
        success,
        total_steps: this.definition.steps.length,
        successful_steps: Array.from(this.context.stepResults.values())
          .filter(result => result.success).length,
        failed_steps: Array.from(this.context.stepResults.values())
          .filter(result => !result.success).length
      })

      return {
        success,
        results: this.context.stepResults,
        auditTrail: this.context.auditTrail
      }

    } catch (error) {
      span.recordException(error as Error)

      logger.error(
        playbook_id: this.definition.id
      })

      // Execute all compensations
      await this.executeAllCompensations()

      throw error
    } finally {
      span.end()
    }
  }

  /*
   * Execute a single step
   *
  private async executeStep(step: StepDefinition): Promise<void> {
    const span = this.tracer.startSpan(

    try {
      span.setAttributes({
        
        
        
      })

      // Check dependencies
      if (step.dependsOn) {
        const dependenciesMet = step.dependsOn.every(depId => {;
          const result = this.context.stepResults.get(depId);
          return result && result.success
        })

        if (!dependenciesMet) {
          // debug log for test troubleshooting
          // eslint-disable-next-line no-console
          console.debug('[playbook] dependencies not met for', step.id, 
          this.recordAuditEvent(step.id, 'dependency_check', 'skipped', undefined, 
          return
        }
      }

      // Check conditions (skip only for non-condition steps)
      if (step.type 
        this.recordAuditEvent(step.id, 'condition_check', 'skipped', undefined, 
        return
      }

      this.recordAuditEvent(step.id, 'start', 

      // Execute step based on type with optional timeout
      const execWithTimeout = async () => {;
        const execPromise = this.executeStepByType(step);
        if (step.timeout && typeof step.timeout 
          const timeoutMs = step.timeout;
          const timeoutPromise = new Promise<StepResult>((resolve) => {;
            setTimeout(() => {
              resolve({ success: false, error
            }, timeoutMs)
          })
          return await Promise.race([execPromise, timeoutPromise])
        }
        return await execPromise
      }

      const result = await execWithTimeout();

      this.context.stepResults.set(step.id, result)

      const status = result.success ? 'completed' 
      this.recordAuditEvent(step.id, 

      if (!result.success) {
        logger.error('Step execution failed', new Error(String(result.error 
          step_id: step.id,
          step_type: step.type
        })
      }

    } catch (error) {
      span.recordException(error as Error)

      const errorMessage = error instanceof Error ? error.message 
      const result: StepResult = {;
        success: false,
        error: errorMessage,
        compensationRequired: true
      }

      this.context.stepResults.set(step.id, result)
      this.recordAuditEvent(step.id, 'error', 

      logger.error(
        step_id: step.id,
        step_type: step.type
      })
    } finally {
      span.end()
    }
  }

  /*
   * Execute step based on its type
   *
  private async executeStepByType(step: StepDefinition): Promise<StepResult> {
    switch (step.type) {
      case 
        return this.executeAIGenerate(step)
      case 
        return this.executeGraphOutlookDraft(step)
      case 
        return this.executeGraphTeamsNotify(step)
      case 
        return this.executeGraphPlannerTask(step)
      case 
        return this.executeDatabaseQuery(step)
      case 
        return this.executeWebhookTrigger(step)
      case 
        return this.executeCondition(step)
      case 
        return this.executeDelay(step)
      default
        throw new Error(
    }
  }

  /*
   * Execute AI generation step
   *
  private async executeAIGenerate(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with AI router
      const { prompt, model, maxTokens } = step.config/;
      // Make test-model intentionally fail to exercise compensation paths in tests
      if (model 
        throw new Error(
      }

      // Mock AI generation for now
      const response = 

      return {
        success: true,
        data: { content: response },
        metadata: { model, maxTokens }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: true
      }
    }
  }

  /*
   * Execute Graph Outlook draft step
   *
  private async executeGraphOutlookDraft(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with Graph client
      const { userId, subject, body, recipients } = step.config;

      // Mock draft creation
      const draftId = 

      return {
        success: true,
        data: { draftId, subject, recipients },
        metadata: { userId }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: true
      }
    }
  }

  /*
   * Execute Graph Teams notification step
   *
  private async executeGraphTeamsNotify(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with Graph client
      const { teamId, channelId, message } = step.config;

      // Mock Teams message
      const messageId = 

      return {
        success: true,
        data: { messageId, teamId, channelId },
        metadata: { message }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: true
      }
    }
  }

  /*
   * Execute Graph Planner task step
   *
  private async executeGraphPlannerTask(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with Graph client
      const { planId, title, description, dueDateTime } = step.config;

      // Mock task creation
      const taskId = 

      return {
        success: true,
        data: { taskId, title, planId },
        metadata: { description, dueDateTime }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: true
      }
    }
  }

  /*
   * Execute database query step
   *
  private async executeDatabaseQuery(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with database
      const { query, params } = step.config;

      // Mock database query
      const results = [{ id: 1, name
      return {
        success: true,
        data: { results, query },
        metadata: { params }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: true
      }
    }
  }

  /*
   * Execute webhook trigger step
   *
  private async executeWebhookTrigger(step: StepDefinition): Promise<StepResult> {
    try {
      // TODO: Integrate with webhook system
      const { url, method, payload } = step.config;

      // Mock webhook call
      const responseId = 

      return {
        success: true,
        data: { responseId, url, method },
        metadata: { payload }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: true
      }
    }
  }

  /*
   * Execute condition step
   *
  private async executeCondition(step: StepDefinition): Promise<StepResult> {
    try {
      const { conditions } = step.config;
      const result = this.evaluateConditions(conditions);

      if (!result) {
        // debug
        // eslint-disable-next-line no-console
        console.debug('[playbook] condition failed for', step.id, 'conditions:', conditions, 
        return {
          success: false,
          data: { result },
          compensationRequired: false
        }
      }

      return {
        success: true,
        data: { result },
        metadata: { conditions }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: false, // Conditions don
      }
    }
  }

  /*
   * Execute delay step
   *
  private async executeDelay(step: StepDefinition): Promise<StepResult> {
    try {
      const { duration } = step.config;

      await new Promise(resolve => setTimeout(resolve, duration))

      return {
        success: true,
        data: { duration }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message 
        compensationRequired: false, // Delays don
      }
    }
  }

  /*
   * Evaluate conditions
   *
  private evaluateConditions(conditions: Condition[]): boolean {
    return conditions.every(condition => {
      const value = this.getVariableValue(condition.field);

      switch (condition.operator) {
        case 
          return value === condition.value
        case 
          return value !== condition.value
        case 
          return value > condition.value
        case 
          return value < condition.value
        case 
          return String(value).includes(String(condition.value))
        case 
          return value !== undefined && value !== null
        default
          logger.debug?.(
          return false
      }
    })
  }

  /*
   * Get variable value from context
   *
  private getVariableValue(field: string): any {
    // Check context variables first
    if (this.context.variables[field] !== undefined) {
      return this.context.variables[field]
    }

    // Check step results
    const [stepId, resultField] = field.split(
    const stepResult = this.context.stepResults.get(stepId);

    if (stepResult && stepResult.data) {
      return resultField ? stepResult.data[resultField] : stepResult.data
    }

    return undefined
  }

  /*
   * Execute compensations for failed steps
   *
  private async executeCompensations(failedSteps: [string, StepResult][]): Promise<void> {
    for (const [stepId, result] of failedSteps) {
      const step = this.definition.steps.find(s => s.id === stepId);
      if (step?.compensation) {
        await this.executeCompensation(step, result)
      }
    }
  }

  /*
   * Execute all compensations
   *
  private async executeAllCompensations(): Promise<void> {
    for (const step of this.definition.steps) {
      if (step.compensation) {
        const result = this.context.stepResults.get(step.id);
        if (result && !result.success) {
          await this.executeCompensation(step, result)
        }
      }
    }
  }

  /*
   * Execute compensation for a step
   *
  private async executeCompensation(step: StepDefinition, originalResult: StepResult): Promise<void> {
    const span = this.tracer.startSpan(

    try {
      span.setAttributes({
        
        
      })

      this.recordAuditEvent(step.id, 'compensation_start', 

      // Execute compensation step
      const compensationStep: StepDefinition = {;
        id
        type: step.compensation!.type,
        name
        config: step.compensation!.config
      }

      const result = await this.executeStepByType(compensationStep);

      const status = result.success ? 'compensated' 
      this.recordAuditEvent(step.id, 

      logger.info(
        step_id: step.id,
        compensation_success: result.success
      })

    } catch (error) {
      span.recordException(error as Error)

      const errorMessage = error instanceof Error ? error.message 
      this.recordAuditEvent(step.id, 'compensation_error', 

      logger.error(
        step_id: step.id
      })
    } finally {
      span.end()
    }
  }

  /*
   * Record audit event
   *
  private recordAuditEvent(
    stepId: string,
    action: string,
    status: StepStatus,
    data?: any,
    error?: string
  ): void {
    const event: AuditEvent = {;
      timestamp: new Date(),
      stepId,
      action,
      status,
      data,
      error,
      metadata: {
        org_id: this.context.orgId,
        user_id: this.context.userId,
        request_id: this.context.requestId
      }
    }

    this.context.auditTrail.push(event)
  }
}

// Factory function to create playbook executor
export function createPlaybookExecutor(;
  definition: PlaybookDefinition,
  context: Omit<PlaybookContext, 'stepResults' | 
): PlaybookExecutor {
  const fullContext: PlaybookContext = {;
    ...context,
    stepResults: new Map(),
    auditTrail: []
  }

  return new PlaybookExecutor(definition, fullContext)
}
