#!/usr/bin/env tsx
/**
 * Database Seed Script
 * Populates the database with initial data for development
 */

import { getDbClient, closeDbClient, users, agents } from './client';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    const db = getDbClient();
    
    // Seed Users
    console.log('👤 Creating users...');
    const testTenantId = crypto.randomUUID();
    
    await db.insert(users).values([
      {
        email: 'admin@econeura.com',
        name: 'Admin User',
        tenantId: testTenantId,
        role: 'admin',
        enabled: true,
      },
      {
        email: 'analyst@econeura.com',
        name: 'Analyst User',
        tenantId: testTenantId,
        role: 'analyst',
        enabled: true,
      },
      {
        email: 'manager@econeura.com',
        name: 'Manager User',
        tenantId: testTenantId,
        role: 'manager',
        enabled: true,
      },
      {
        email: 'viewer@econeura.com',
        name: 'Viewer User',
        tenantId: testTenantId,
        role: 'viewer',
        enabled: true,
      },
    ]);
    
    console.log('✅ Created 4 users');
    
    // Seed Agents
    console.log('🤖 Creating agents...');
    
    const agentConfigs = [
      { id: 'neura-1', title: 'Analytics Agent', dept: 'analytics', desc: 'Data analysis and insights' },
      { id: 'neura-2', title: 'Chief Data Officer', dept: 'cdo', desc: 'Data governance and strategy' },
      { id: 'neura-3', title: 'Chief Financial Officer', dept: 'cfo', desc: 'Financial planning and analysis' },
      { id: 'neura-4', title: 'Chief Human Resources Officer', dept: 'chro', desc: 'HR and talent management' },
      { id: 'neura-5', title: 'Chief Information Security Officer', dept: 'ciso', desc: 'Security and compliance' },
      { id: 'neura-6', title: 'Chief Marketing Officer', dept: 'cmo', desc: 'Marketing strategy and campaigns' },
      { id: 'neura-7', title: 'Chief Technology Officer', dept: 'cto', desc: 'Technology strategy and architecture' },
      { id: 'neura-8', title: 'Legal Agent', dept: 'legal', desc: 'Legal compliance and contracts' },
      { id: 'neura-9', title: 'Reception Agent', dept: 'reception', desc: 'Customer service and support' },
      { id: 'neura-10', title: 'Research Agent', dept: 'research', desc: 'Market and competitive research' },
      { id: 'neura-11', title: 'Support Agent', dept: 'support', desc: 'Technical support and troubleshooting' },
    ];
    
    await db.insert(agents).values(
      agentConfigs.map(config => ({
        id: config.id,
        title: config.title,
        department: config.dept,
        description: config.desc,
        webhookUrl: `https://hook.make.com/${config.dept}`,
        enabled: true,
        config: {
          maxTokens: 4000,
          temperature: 0.7,
          model: 'gpt-4',
        },
      }))
    );
    
    console.log(`✅ Created ${agentConfigs.length} agents`);
    
    console.log('🎉 Seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Tenant ID: ${testTenantId}`);
    console.log(`   - Users: 4 (admin, analyst, manager, viewer)`);
    console.log(`   - Agents: ${agentConfigs.length}`);
    console.log(`\n🔑 Test credentials:`);
    console.log(`   admin@econeura.com (role: admin)`);
    console.log(`   analyst@econeura.com (role: analyst)`);
    console.log(`   manager@econeura.com (role: manager)`);
    console.log(`   viewer@econeura.com (role: viewer)`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await closeDbClient();
  }
}

seed();
