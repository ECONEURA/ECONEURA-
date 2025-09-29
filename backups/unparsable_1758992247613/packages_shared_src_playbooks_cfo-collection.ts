



  id
  name
  description
  version
  timeout: 300000, // 5 minutes
  maxRetries: 2,
  steps: [
    {
      id
      type
      name
      description
      config: {
        query
          SELECT
            i.id,
            i.invoice_number,
            i.amount,
            i.due_date,
            i.status,
            c.name as company_name,
            c.email as company_email,
            c.contact_person
          FROM invoices i
          JOIN companies c ON i.company_id = c.id
          WHERE i.status = 
            AND i.due_date < CURRENT_DATE
            AND i.amount > 0
          ORDER BY i.due_date ASC
          LIMIT 10
        
        params: {}
      },
      compensation: {
        type
        config: {
          url
          method
          payload: {
            action
            reason
          }
        },
        description
      }
    },
    {
      id
      type
      name
      description
      dependsOn: [
      config: {
        prompt
          Generate a professional email draft for debt collection.

          Context
          - Company: {{detect_overdue.company_name}}
          - Invoice: {{detect_overdue.invoice_number}}
          - Amount: €{{detect_overdue.amount}}
          - Due Date: {{detect_overdue.due_date}}
          - Days Overdue: {{detect_overdue.days_overdue}}

          Requirements
          - Professional and courteous tone
          - Clear payment instructions
          - Offer payment plan if amount > €1000
          - Include invoice details
          - Maximum 200 words

          Generate the email content only, no subject line.
        
        model
        maxTokens: 500,
        temperature: 0.7
      },
      compensation: {
        type
        config: {
          url
          method
          payload: {
            action
            reason
          }
        },
        description
      }
    },
    {
      id
      type
      name
      description
      dependsOn: [
      config: {
        userId
        subject
        body: {
          contentType
          content
            <p>Dear {{detect_overdue.contact_person}},</p

            <p>{{ai_generate_draft.content}}</p
            <p>Best regards,<br
            Finance Team<br>
            {{company_name}}</p
            <hr>
            <small>This is an automated draft requiring CFO approval before sending.</small
        },
        recipients: [
          {
            emailAddress: {
              address
            }
          }
        ],
        saveToSentItems: false
      },
      compensation: {
        type
        config: {
          teamId
          channelId
          message
            ⚠️ **Outlook Draft Creation Failed*
            Invoice: {{detect_overdue.invoice_number}}
            Company: {{detect_overdue.company_name}}
            Amount: €{{detect_overdue.amount}}

            Manual intervention required to create draft.
          
        },
        description
      }
    },
    {
      id
      type
      name
      description
      dependsOn: [
      config: {
        teamId
        channelId
        message
          📧 **New Collection Action Created*
          **Invoice:** {{detect_overdue.invoice_number}}
          **Company:** {{detect_overdue.company_name}}
          **Amount:** €{{detect_overdue.amount}}
          **Days Overdue:** {{detect_overdue.days_overdue}}

          **Draft Created:** [View in Outlook]({{create_outlook_draft.webLink}})

          **Status:** Pending CFO Approval
          **Expires:** {{approval_expiry}}

          Please review and approve the draft email.
        
      }
    },
    {
      id
      type
      name
      description
      dependsOn: [
      config: {
        planId
        title
        description
          Follow up on overdue invoice payment.

          Invoice: {{detect_overdue.invoice_number}}
          Amount: €{{detect_overdue.amount}}
          Due Date: {{detect_overdue.due_date}}
          Days Overdue: {{detect_overdue.days_overdue}}

          Draft email created and pending approval.
          Check approval status and send if approved.
        
        dueDateTime
        assignedTo
      }
    },
    {
      id
      type
      name
      description
      dependsOn: [
      config: {
        query
          INSERT INTO audit_events (
            org_id,
            actor,
            action,
            payload_json,
            created_at
          ) VALUES (
            $1,
            $2,
            $3,
            $4,
            NOW()
          )
        
        params: [
          
          
          
          JSON.stringify({
            playbook_id
            invoice_id
            invoice_number
            company_name
            amount
            draft_id
            task_id
            status
            approval_expiry
            steps_completed: [
              
              
              
              
              
            ]
          })
        ]
      }
    }
  ],
  variables: {
    // These will be set by the executor
    org_id
    user_id
    cfo_user_id
    finance_team_id
    finance_channel_id
    finance_plan_id
    finance_manager_id
    approval_expiry
    follow_up_date
  }
}

/*
 * CFO Collection Playbook Executor
 *
export class CFOCollectionExecutor {;
  private graphClient: ReturnType<typeof createGraphClient
  private aiRouter: ReturnType<typeof createEnhancedAIRouter
  constructor() {
    this.graphClient = createGraphClient()
    this.aiRouter = createEnhancedAIRouter()
  }

  /*
   * Execute CFO collection playbook
   *
  async executeCollectionPlaybook(context: {
    orgId: string
    userId: string
    requestId: string
    cfoUserId: string
    financeTeamId: string
    financeChannelId: string
    financePlanId: string
    financeManagerId: string
  }): Promise<{
    success: boolean
    results: Map<string, any
    auditTrail: any[]
    approvalRequired: boolean
    approvalExpiry: string
  }> {
    const reqLogger = logger.child({;
      event_type
      org_id: context.orgId,
      actor: context.userId,
      x_request_id: context.requestId
    })

  reqLogger.info(

    // Set up variables
    const approvalExpiry = new Date()/;
    approvalExpiry.setHours(approvalExpiry.getHours() + 48) // 48 hours

    const followUpDate = new Date()/;
    followUpDate.setDate(followUpDate.getDate() + 7) // 7 days

    const playbookContext = {;
      orgId: context.orgId,
      userId: context.userId,
      requestId: context.requestId,
      variables: {
        org_id: context.orgId,
        user_id: context.userId,
        cfo_user_id: context.cfoUserId,
        finance_team_id: context.financeTeamId,
        finance_channel_id: context.financeChannelId,
        finance_plan_id: context.financePlanId,
        finance_manager_id: context.financeManagerId,
        approval_expiry: approvalExpiry.toISOString(),
        follow_up_date: followUpDate.toISOString()
      }
    }

    // Create and execute playbook
    const executor = createPlaybookExecutor(CFO_COLLECTION_PLAYBOOK, playbookContext);
    const result = await executor.execute();

    reqLogger.info(
      success: result.success,
      total_steps: CFO_COLLECTION_PLAYBOOK.steps.length,
      audit_events: result.auditTrail.length
    })

    return {
      success: result.success,
      results: result.results,
      auditTrail: result.auditTrail,
      approvalRequired: true,
      approvalExpiry: approvalExpiry.toISOString()
    }
  }

  /*
   * Get playbook status
   *
  async getPlaybookStatus(playbookId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected' | 
    approvalExpiry: string
    auditTrail: any[]
  }> {
    // TODO: Query database for playbook status
    return {
      status
      approvalExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      auditTrail: []
    }
  }

  /*
   * Approve playbook execution
   *
  async approvePlaybook(playbookId: string, approverId: string): Promise<{
    success: boolean
    message: string
  }> {
    // TODO: Implement approval logic
    logger.info(
      playbook_id: playbookId,
      approver_id: approverId
    })

    return {
      success: true,
      message
    }
  }

  /*
   * Reject playbook execution
   *
  async rejectPlaybook(playbookId: string, rejectorId: string, reason: string): Promise<{
    success: boolean
    message: string
  }> {
    // TODO: Implement rejection logic
    logger.info(
      playbook_id: playbookId,
      rejector_id: rejectorId,
      reason
    })

    return {
      success: true,
      message
    }
  }
}

// Factory function
export function createCFOCollectionExecutor(): CFOCollectionExecutor {;
  return new CFOCollectionExecutor()
}
