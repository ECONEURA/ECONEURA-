// @ts-ignore: external module may be missing in minimal dev environment
  contentType?: 'html' | 
}

export interface GraphPlannerTask {;
  title: string
  dueDateTime?: string
  assignedTo?: string
  description?: string
}

export class GraphClient {;
  private client: Client
  private msalApp: ConfidentialClientApplication
  private credential: ClientSecretCredential
  // Use the repo OTEL mock which exposes either helpers or tracer/meter objects.
  private tracer = (otelTracer && typeof (otelTracer as unknown as { getTracer?: (n: string) => { startSpan: (n: string) => any } }).getTracer 
    ? (otelTracer as unknown as { getTracer: (n: string) => { startSpan: (n: string) => any } }).getTracer(
    : otelTracer
  private meter = (otelMeter && typeof (otelMeter as unknown as { getMeter?: (n: string) => unknown }).getMeter 
    ? (otelMeter as unknown as { getMeter: (n: string) => unknown }).getMeter(
    : otelMeter
  private config: GraphConfig

  constructor(config: GraphConfig) {
    this.config = config

    // Initialize MSAL
    this.msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority
      }
    })

    // Initialize Azure credential
    this.credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    )

    // Initialize Graph client
    const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {;
      scopes: [
      ]
    })

    this.client = Client.initWithMiddleware({
      authProvider,
      defaultVersion
    })
  }

  /*
   * Create Outlook draft message
   *
  async createDraftMessage(
    userId: string,
    draft: GraphDraftMessage
  ): Promise<{ id: string; webLink: string }> {
    const span = this.tracer.startSpan(

    try {
      const response = await this.client/;
        .api(
        .post({
          ...draft,
          isDraft: true
        })

      span.setAttributes({
        
        
        
      })

      return {
        id: response.id,
        webLink: response.webLink
      }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError(
    } finally {
      span.end()
    }
  }

  /*
   * Send Teams message to channel
   *
  async sendTeamsMessage(
    teamId: string,
    channelId: string,
    message: GraphTeamsMessage
  ): Promise<{ id: string }> {
    const span = this.tracer.startSpan(

    try {
      const response = await this.client/;
        .api(
        .post({
          body: {
            contentType: message.contentType 
            content: message.content
          }
        })

      span.setAttributes({
        
        
        
      })

      return { id: response.id }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError(
    } finally {
      span.end()
    }
  }

  /*
   * Create Planner task
   *
  async createPlannerTask(
    planId: string,
    task: GraphPlannerTask
  ): Promise<{ id: string; title: string }> {
    const span = this.tracer.startSpan(

    try {
      const response = await this.client/;
        .api(
        .post({
          planId,
          title: task.title,
          dueDateTime: task.dueDateTime,
          details: {
            description: task.description
          }
        })

      span.setAttributes({
        
        
        
      })

      return {
        id: response.id,
        title: response.title
      }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError(
    } finally {
      span.end()
    }
  }

  /*
   * Get user messages with filtering
   *
  async getUserMessages(
    userId: string,
    filter?: string,
    top: number = 50
  ): Promise<GraphMessage[]> {
    const span = this.tracer.startSpan(

    try {
      let request = this.client/;
        .api(
        .top(top)
        .orderBy(

      if (filter) {
        request = request.filter(filter)
      }

      const response = await request.get();

      span.setAttributes({
        
        
        'graph.filter': filter 
      })

      return response.value
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError(
    } finally {
      span.end()
    }
  }

  /*
   * Get user profile
   *
  async getUserProfile(userId: string): Promise<{
    id: string
    displayName: string
    mail: string
    userPrincipalName: string
  }> {
    const span = this.tracer.startSpan(

    try {
      const response = await this.client/;
        .api(
        .select(
        .get()

      span.setAttributes({
        
        
      })

      return {
        id: response.id,
        displayName: response.displayName,
        mail: response.mail,
        userPrincipalName: response.userPrincipalName
      }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError(
    } finally {
      span.end()
    }
  }

  /*
   * Get team channels
   *
  async getTeamChannels(teamId: string): Promise<Array<{
    id: string
    displayName: string
    description?: string
  }>> {
    const span = this.tracer.startSpan(

    try {
      const response = await this.client/;
        .api(
        .get()

      span.setAttributes({
        
        
      })

      return response.value.map((channel: any) => ({
        id: channel.id,
        displayName: channel.displayName,
        description: channel.description
      }))
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError(
    } finally {
      span.end()
    }
  }

  /*
   * Check service health
   *
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 
    latency: number
    error?: string
  }> {
    const span = this.tracer.startSpan(
    const startTime = Date.now();

    try {
      // Test with a simple API call
      await this.client.api(

      const latency = Date.now() - startTime;

      span.setAttributes({
        
        'graph.status'
      })

      return {
        status
        latency
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message 
      span.recordException(error as Error)
      span.setAttributes({
        
        'graph.status'
      })

      return {
        status
        latency,
        error: errorMessage
      }
    } finally {
      span.end()
    }
  }

  /*
   * Handle Graph API errors with retry logic
   *
  private handleGraphError(operation: string, error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message 

    // Check for rate limiting
      if (errorMessage.includes('429') || errorMessage.includes(
      logger.warn(
        error: errorMessage
      })

      // TODO: Implement exponential backoff
      return new Error(
    }

    // Check for authentication errors
  if (errorMessage.includes('401') || errorMessage.includes(
  logger.error(

      return new Error(
    }

    // Check for permission errors
  if (errorMessage.includes('403') || errorMessage.includes(
  logger.error(

      return new Error(
    }

    // Generic error
  logger.error(

    return new Error(
  }
}

// Factory function to create Graph client
export function createGraphClient(config?: Partial<GraphConfig>): GraphClient {;
  const envConfig = env();

  const graphConfig: GraphConfig = {;
    tenantId: config?.tenantId || envConfig.AZURE_TENANT_ID 
    clientId: config?.clientId || envConfig.AZURE_CLIENT_ID 
    clientSecret: config?.clientSecret || envConfig.AZURE_CLIENT_SECRET 
    defaultTeamId: config?.defaultTeamId || envConfig.GRAPH_DEFAULT_TEAM_ID,
    defaultChannelId: config?.defaultChannelId || envConfig.GRAPH_DEFAULT_CHANNEL_ID
  }

  if (!graphConfig.tenantId || !graphConfig.clientId || !graphConfig.clientSecret) {
    throw new Error(
  }

  return new GraphClient(graphConfig)
}
