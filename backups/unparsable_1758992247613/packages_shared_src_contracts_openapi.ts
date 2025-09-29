// ============================================================================
// OPENAPI 3.0 SPECIFICATION - ECONEURA API
// =========================================================================
export const openApiSpec = {;
  openapi
  info: {
    title
    description
    version
    contact: {
      name
      email
    },
    license: {
      name
      url
    }
  },
  servers: [
    {
      url
      description
    },
    {
      url
      description
    },
    {
      url
      description
    }
  ],
  security: [
    {
      BearerAuth: []
    },
    {
      ApiKeyAuth: []
    }
  ],
  paths: {
      post: {
        tags: [
        summary
        description
        operationId
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      post: {
        tags: [
        summary
        description
        operationId
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            required: true,
            schema: { type: 'string', format
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      put: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            required: true,
            schema: { type: 'string', format
          }
        ],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      delete: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            required: true,
            schema: { type: 'string', format
          }
        ],
        responses: {
          
            description
          },
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            required: true,
            schema: { type: 'string', format
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      put: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            required: true,
            schema: { type: 'string', format
          }
        ],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      delete: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            required: true,
            schema: { type: 'string', format
          }
        ],
        responses: {
          
            description
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name
            in
            schema: { type
          },
          {
            name
            in
            schema: { type
          }
        ],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      },
      post: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
              schema: {
                $ref
              }
            }
          }
        },
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    },
      get: {
        tags: [
        summary
        description
        operationId
        security: [{ BearerAuth: [] }],
        responses: {
          
            description
            content: {
                schema: {
                  $ref
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type
        scheme
        bearerFormat
      },
      ApiKeyAuth: {
        type
        in
        name
      }
    },
    schemas: {
      BaseResponse: {
        type
        properties: {
          success: { type
          data: { type
          error: { type
          message: { type
          requestId: { type
          timestamp: { type: 'string', format
          processingTime: { type
        },
        required: ['success', 'requestId', 
      },
      ErrorResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              success: { type
              error: { type
              message: { type
            }
          }
        ]
      },
      Pagination: {
        type
        properties: {
          page: { type
          limit: { type
          total: { type
          totalPages: { type
          hasNext: { type
          hasPrev: { type
        },
        required: ['page', 
      },
      LoginRequest: {
        type
        properties: {
          email: { type: 'string', format
          password: { type
          organizationId: { type: 'string', format
          rememberMe: { type
          mfaToken: { type
        },
        required: ['email', 
      },
      LoginResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: {
                type
                properties: {
                  user: { $ref
                  accessToken: { type
                  refreshToken: { type
                  expiresIn: { type
                  tokenType: { type: 'string', enum: [
                }
              }
            }
          }
        ]
      },
      RefreshTokenRequest: {
        type
        properties: {
          refreshToken: { type
        },
        required: [
      },
      RefreshTokenResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: {
                type
                properties: {
                  accessToken: { type
                  refreshToken: { type
                  expiresIn: { type
                  tokenType: { type: 'string', enum: [
                }
              }
            }
          }
        ]
      },
      LogoutRequest: {
        type
        properties: {
          sessionId: { type
        }
      },
      User: {
        type
        properties: {
          id: { type: 'string', format
          email: { type: 'string', format
          name: { type
          organizationId: { type: 'string', format
          roles: { type: 'array', items: { type
          permissions: { type: 'array', items: { type
          isActive: { type
          lastLoginAt: { type: 'string', format
          createdAt: { type: 'string', format
          updatedAt: { type: 'string', format
        },
        required: ['id', 'email', 'name', 'organizationId', 'roles', 'permissions', 'isActive', 'createdAt', 
      },
      UserResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { $ref
            }
          }
        ]
      },
      UserListResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { type: 'array', items: { $ref
              pagination: { $ref
            }
          }
        ]
      },
      CreateUserRequest: {
        type
        properties: {
          email: { type: 'string', format
          name: { type
          password: { type
          organizationId: { type: 'string', format
          roles: { type: 'array', items: { type
        },
        required: ['email', 'name', 'password', 
      },
      UpdateUserRequest: {
        type
        properties: {
          name: { type
          email: { type: 'string', format
          roles: { type: 'array', items: { type
          isActive: { type
        }
      },
      Contact: {
        type
        properties: {
          id: { type: 'string', format
          firstName: { type
          lastName: { type
          email: { type: 'string', format
          phone: { type
          company: { type
          title: { type
          organizationId: { type: 'string', format
          tags: { type: 'array', items: { type
          customFields: { type
          createdAt: { type: 'string', format
          updatedAt: { type: 'string', format
        },
        required: ['id', 'firstName', 'lastName', 'organizationId', 'createdAt', 
      },
      ContactResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { $ref
            }
          }
        ]
      },
      ContactListResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { type: 'array', items: { $ref
              pagination: { $ref
            }
          }
        ]
      },
      CreateContactRequest: {
        type
        properties: {
          firstName: { type
          lastName: { type
          email: { type: 'string', format
          phone: { type
          company: { type
          title: { type
          tags: { type: 'array', items: { type
          customFields: { type
        },
        required: ['firstName', 
      },
      UpdateContactRequest: {
        type
        properties: {
          firstName: { type
          lastName: { type
          email: { type: 'string', format
          phone: { type
          company: { type
          title: { type
          tags: { type: 'array', items: { type
          customFields: { type
        }
      },
      Deal: {
        type
        properties: {
          id: { type: 'string', format
          title: { type
          description: { type
          value: { type
          currency: { type: 'string', default
          stage: { type
          probability: { type
          contactId: { type: 'string', format
          organizationId: { type: 'string', format
          expectedCloseDate: { type: 'string', format
          customFields: { type
          createdAt: { type: 'string', format
          updatedAt: { type: 'string', format
        },
        required: ['id', 'title', 'value', 'stage', 'organizationId', 'createdAt', 
      },
      DealResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { $ref
            }
          }
        ]
      },
      DealListResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { type: 'array', items: { $ref
              pagination: { $ref
            }
          }
        ]
      },
      CreateDealRequest: {
        type
        properties: {
          title: { type
          description: { type
          value: { type
          currency: { type: 'string', default
          stage: { type
          probability: { type
          contactId: { type: 'string', format
          expectedCloseDate: { type: 'string', format
          customFields: { type
        },
        required: ['title', 'value', 
      },
      Product: {
        type
        properties: {
          id: { type: 'string', format
          name: { type
          description: { type
          sku: { type
          price: { type
          currency: { type: 'string', default
          category: { type
          organizationId: { type: 'string', format
          isActive: { type
          customFields: { type
          createdAt: { type: 'string', format
          updatedAt: { type: 'string', format
        },
        required: ['id', 'name', 'sku', 'price', 'organizationId', 'isActive', 'createdAt', 
      },
      ProductResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { $ref
            }
          }
        ]
      },
      ProductListResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { type: 'array', items: { $ref
              pagination: { $ref
            }
          }
        ]
      },
      CreateProductRequest: {
        type
        properties: {
          name: { type
          description: { type
          sku: { type
          price: { type
          currency: { type: 'string', default
          category: { type
          customFields: { type
        },
        required: ['name', 'sku', 
      },
      Order: {
        type
        properties: {
          id: { type: 'string', format
          orderNumber: { type
          customerId: { type: 'string', format
          organizationId: { type: 'string', format
          status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 
          total: { type
          currency: { type: 'string', default
          items: {
            type
            items: {
              type
              properties: {
                productId: { type: 'string', format
                quantity: { type
                price: { type
                total: { type
              }
            }
          },
          shippingAddress: {
            type
            properties: {
              street: { type
              city: { type
              state: { type
              zipCode: { type
              country: { type
            }
          },
          customFields: { type
          createdAt: { type: 'string', format
          updatedAt: { type: 'string', format
        },
        required: ['id', 'orderNumber', 'customerId', 'organizationId', 'status', 'total', 'items', 'createdAt', 
      },
      OrderResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { $ref
            }
          }
        ]
      },
      OrderListResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { type: 'array', items: { $ref
              pagination: { $ref
            }
          }
        ]
      },
      CreateOrderRequest: {
        type
        properties: {
          customerId: { type: 'string', format
          items: {
            type
            items: {
              type
              properties: {
                productId: { type: 'string', format
                quantity: { type
                price: { type
              },
              required: ['productId', 'quantity', 
            },
            minItems: 1
          },
          shippingAddress: {
            type
            properties: {
              street: { type
              city: { type
              state: { type
              zipCode: { type
              country: { type
            }
          },
          customFields: { type
        },
        required: ['customerId', 
      },
      AIRequest: {
        type
        properties: {
          prompt: { type
          model: { type
          temperature: { type
          maxTokens: { type
          organizationId: { type: 'string', format
          userId: { type: 'string', format
          context: { type
        },
        required: ['prompt', 'organizationId', 
      },
      AIResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: {
                type
                properties: {
                  id: { type: 'string', format
                  prompt: { type
                  response: { type
                  model: { type
                  usage: {
                    type
                    properties: {
                      promptTokens: { type
                      completionTokens: { type
                      totalTokens: { type
                    }
                  },
                  cost: { type
                  processingTime: { type
                  createdAt: { type: 'string', format
                }
              }
            }
          }
        ]
      },
      Webhook: {
        type
        properties: {
          id: { type: 'string', format
          name: { type
          url: { type: 'string', format
          events: { type: 'array', items: { type
          organizationId: { type: 'string', format
          isActive: { type
          secret: { type
          headers: { type
          createdAt: { type: 'string', format
          updatedAt: { type: 'string', format
        },
        required: ['id', 'name', 'url', 'events', 'organizationId', 'isActive', 'createdAt', 
      },
      WebhookResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { $ref
            }
          }
        ]
      },
      WebhookListResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: { type: 'array', items: { $ref
              pagination: { $ref
            }
          }
        ]
      },
      CreateWebhookRequest: {
        type
        properties: {
          name: { type
          url: { type: 'string', format
          events: { type: 'array', items: { type
          headers: { type
        },
        required: ['name', 'url', 
      },
      HealthResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: {
                type
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 
                  version: { type
                  uptime: { type
                  services: {
                    type
                    properties: {
                      database: { type: 'string', enum: ['up', 
                      redis: { type: 'string', enum: ['up', 
                      ai: { type: 'string', enum: ['up', 
                    }
                  }
                }
              }
            }
          }
        ]
      },
      MetricsResponse: {
        allOf: [
          { $ref
          {
            type
            properties: {
              data: {
                type
                properties: {
                  requests: { type
                  performance: { type
                  errors: { type
                  ai: { type
                }
              }
            }
          }
        ]
      }
    }
  },
  tags: [
    {
      name
      description
    },
    {
      name
      description
    },
    {
      name
      description
    },
    {
      name
      description
    },
    {
      name
      description
    },
    {
      name
      description
    },
    {
      name
      description
    }
  ]
};

export default openApiSpec;
