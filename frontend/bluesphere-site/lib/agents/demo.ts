/*
 * BlueSphere AI Agent Demo
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Demonstrates how AI personas help with program of work management
 */

import { agentCoordinator } from './agent-coordinator';

/**
 * Demo: How AI personas help with your BlueSphere program of work
 */
export async function demoAIPersonasForProgramOfWork() {
  console.log('🌊 BlueSphere AI Agent Demo - Program of Work Management');
  console.log('='.repeat(60));

  // Example 1: Creating a new work program
  console.log('\n📋 Example 1: Creating a Marine Wildlife Tracking Program');

  const { program, analysis } = await agentCoordinator.createWorkProgram(
    'Real-time Whale Migration Tracking System',
    'Implement a comprehensive system to track whale migration patterns in real-time using satellite tags and AI prediction models for conservation research',
    [
      'Enable real-time tracking of whale movements',
      'Predict migration patterns using AI',
      'Provide data to marine conservation organizations',
      'Support climate change impact research'
    ],
    [
      'Marine biologists',
      'Conservation organizations',
      'Government marine agencies',
      'Climate researchers'
    ],
    [
      'Limited budget for satellite data',
      'Animal welfare regulations',
      'Data privacy for location information'
    ],
    '6 months'
  );

  console.log(`\n✅ Program created: ${program.title}`);
  console.log(`📊 Status: ${program.status}`);

  // Show agent insights
  console.log('\n🤖 Agent Analysis Summary:');
  console.log(analysis.summary);

  console.log('\n👔 Business Analyst Perspective:');
  const baAgent = analysis.agents.find(a => a.agent === 'business-analyst');
  if (baAgent) {
    console.log(`Analysis: ${baAgent.analysis.substring(0, 200)}...`);
    console.log(`Priority: ${baAgent.priority.toUpperCase()}`);
    console.log(`Effort: ${baAgent.estimatedEffort}`);
  }

  console.log('\n📈 Product Manager Perspective:');
  const pmAgent = analysis.agents.find(a => a.agent === 'product-manager');
  if (pmAgent) {
    console.log(`Analysis: ${pmAgent.analysis.substring(0, 200)}...`);
    console.log(`Top recommendations:`);
    pmAgent.recommendations.slice(0, 3).forEach(rec => console.log(`  • ${rec}`));
  }

  console.log('\n💻 Engineering Perspective:');
  const engAgent = analysis.agents.find(a => a.agent === 'engineer');
  if (engAgent) {
    console.log(`Analysis: ${engAgent.analysis.substring(0, 200)}...`);
    console.log(`Key deliverables:`);
    engAgent.deliverables.slice(0, 3).forEach(del => console.log(`  • ${del}`));
  }

  // Example 2: Getting specific agent advice
  console.log('\n\n📋 Example 2: Getting Specific Agent Advice');

  const specificBA = await agentCoordinator.getAgentPerspective(
    program.id,
    'business-analyst',
    'What are the key regulatory requirements for whale tracking?'
  );

  console.log('\n🎯 BA Response to Regulatory Question:');
  console.log(`${specificBA.analysis.substring(0, 300)}...`);
  console.log('\nRecommendations:');
  specificBA.recommendations.forEach(rec => console.log(`  • ${rec}`));

  // Example 3: Program coordination
  console.log('\n\n📋 Example 3: Coordinated Program Plan');
  console.log('\nPhased Implementation:');
  analysis.coordinatedPlan.phases.forEach((phase, i) => {
    console.log(`  ${i + 1}. ${phase}`);
  });

  console.log(`\nTimeline: ${analysis.coordinatedPlan.timeline}`);

  console.log('\nKey Milestones:');
  analysis.coordinatedPlan.keyMilestones.forEach(milestone => {
    console.log(`  🎯 ${milestone}`);
  });

  // Example 4: Generate full report
  console.log('\n\n📋 Example 4: Generated Program Report');
  const report = agentCoordinator.generateProgramReport(program.id);
  console.log('\n📄 Report Preview (first 500 characters):');
  console.log(report.substring(0, 500) + '...');

  return {
    programId: program.id,
    analysis,
    report
  };
}

/**
 * Demo: How this helps with BMAD (Build, Measure, Analyze, Deploy) workflow
 */
export async function demoBMADWorkflow() {
  console.log('\n🔄 BMAD Workflow with AI Personas');
  console.log('='.repeat(40));

  // BUILD phase - Engineering agent
  console.log('\n🏗️  BUILD Phase - Engineering Agent');
  const buildProgram = await agentCoordinator.createWorkProgram(
    'Ocean Temperature API Enhancement',
    'Build enhanced API endpoints for real-time ocean temperature data with improved caching and visualization',
    ['Improve API performance', 'Add real-time capabilities', 'Enhance data visualization']
  );

  const engPerspective = await agentCoordinator.getAgentPerspective(
    buildProgram.program.id,
    'engineer',
    'What is the technical approach for building enhanced ocean temperature APIs?'
  );

  console.log('Engineering Build Plan:');
  console.log(`• Priority: ${engPerspective.priority}`);
  console.log(`• Effort: ${engPerspective.estimatedEffort}`);
  engPerspective.nextSteps.slice(0, 3).forEach(step => console.log(`• ${step}`));

  // MEASURE phase - Product Manager agent
  console.log('\n📊 MEASURE Phase - Product Manager Agent');
  const pmMeasure = await agentCoordinator.getAgentPerspective(
    buildProgram.program.id,
    'product-manager',
    'What metrics should we track for the ocean temperature API success?'
  );

  console.log('PM Success Metrics:');
  pmMeasure.recommendations.forEach(metric => console.log(`• ${metric}`));

  // ANALYZE phase - Business Analyst agent
  console.log('\n🔍 ANALYZE Phase - Business Analyst Agent');
  const baAnalyze = await agentCoordinator.getAgentPerspective(
    buildProgram.program.id,
    'business-analyst',
    'How do we analyze the impact of improved ocean temperature APIs on marine research?'
  );

  console.log('BA Analysis Framework:');
  baAnalyze.deliverables.forEach(deliverable => console.log(`• ${deliverable}`));

  // DEPLOY phase - Coordinated approach
  console.log('\n🚀 DEPLOY Phase - Coordinated Agent Response');
  const deployAnalysis = await agentCoordinator.analyzeWorkProgram(
    buildProgram.program.id,
    'What is our deployment strategy for the enhanced ocean temperature API?'
  );

  console.log('Coordinated Deployment Plan:');
  deployAnalysis.coordinatedPlan.phases.forEach(phase => console.log(`• ${phase}`));

  return buildProgram.program.id;
}

/**
 * Quick demo runner
 */
export async function runAIPersonaDemo() {
  try {
    console.log('🚀 Starting BlueSphere AI Persona Demo...\n');

    // Run main demo
    const mainDemo = await demoAIPersonasForProgramOfWork();

    // Run BMAD workflow demo
    await demoBMADWorkflow();

    console.log('\n✅ Demo completed successfully!');
    console.log('\n💡 Key Benefits of AI Personas for your Program of Work:');
    console.log('  • Multi-perspective analysis (BA, PM, Engineering)');
    console.log('  • Coordinated planning and execution');
    console.log('  • Structured approach to complex marine projects');
    console.log('  • Risk identification and mitigation strategies');
    console.log('  • Automated documentation and reporting');
    console.log('  • BMAD workflow integration');

    return mainDemo;

  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}