/*
 * BlueSphere Agent Coordinator
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Coordinates AI agents for program of work management
 */

import { agentSystem, ProjectContext, AgentResponse } from './multi-agent-system';

export interface WorkProgram {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  constraints: string[];
  stakeholders: string[];
  timeline: string;
  status: 'planning' | 'analysis' | 'implementation' | 'review' | 'complete';
  createdAt: Date;
  lastUpdated: Date;
}

export interface AgentAnalysis {
  programId: string;
  timestamp: Date;
  context: ProjectContext;
  summary: string;
  agents: AgentResponse[];
  coordinatedPlan: {
    phases: string[];
    timeline: string;
    keyMilestones: string[];
    successMetrics: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class BlueSphereAgentCoordinator {
  private static instance: BlueSphereAgentCoordinator;
  private workPrograms: Map<string, WorkProgram> = new Map();
  private analyses: Map<string, AgentAnalysis[]> = new Map();

  static getInstance(): BlueSphereAgentCoordinator {
    if (!BlueSphereAgentCoordinator.instance) {
      BlueSphereAgentCoordinator.instance = new BlueSphereAgentCoordinator();
    }
    return BlueSphereAgentCoordinator.instance;
  }

  /**
   * Create a new work program and run initial agent analysis
   */
  async createWorkProgram(
    title: string,
    description: string,
    objectives: string[],
    stakeholders: string[] = [],
    constraints: string[] = [],
    timeline: string = 'To be determined'
  ): Promise<{ program: WorkProgram; analysis: AgentAnalysis }> {

    const programId = this.generateId();

    const program: WorkProgram = {
      id: programId,
      title,
      description,
      objectives,
      constraints,
      stakeholders,
      timeline,
      status: 'analysis',
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.workPrograms.set(programId, program);

    // Run initial agent analysis
    const analysis = await this.analyzeWorkProgram(programId, description);

    console.log(`✅ Created work program: ${title}`);
    console.log(`🤖 Agent analysis completed for program ${programId}`);

    return { program, analysis };
  }

  /**
   * Run agent analysis on a work program
   */
  async analyzeWorkProgram(programId: string, specificRequest?: string): Promise<AgentAnalysis> {
    const program = this.workPrograms.get(programId);
    if (!program) {
      throw new Error(`Work program ${programId} not found`);
    }

    const request = specificRequest || program.description;
    const domain = this.determineDomain(request);

    const context: ProjectContext = {
      request,
      domain,
      stakeholders: program.stakeholders,
      constraints: program.constraints,
      timeline: program.timeline
    };

    console.log(`🔍 Running agent analysis for: ${program.title}`);

    const result = await agentSystem.runMultiAgentAnalysis(context);

    const analysis: AgentAnalysis = {
      programId,
      timestamp: new Date(),
      context,
      summary: result.summary,
      agents: result.agents,
      coordinatedPlan: result.coordinatedPlan,
      recommendations: this.synthesizeRecommendations(result.agents)
    };

    // Store analysis
    if (!this.analyses.has(programId)) {
      this.analyses.set(programId, []);
    }
    this.analyses.get(programId)!.push(analysis);

    // Update program status
    program.lastUpdated = new Date();
    program.status = 'implementation';

    return analysis;
  }

  /**
   * Get analysis for a specific agent
   */
  async getAgentPerspective(
    programId: string,
    agentType: 'business-analyst' | 'product-manager' | 'engineer',
    specificQuestion?: string
  ): Promise<AgentResponse> {
    const program = this.workPrograms.get(programId);
    if (!program) {
      throw new Error(`Work program ${programId} not found`);
    }

    const request = specificQuestion || program.description;
    const context: ProjectContext = {
      request,
      domain: this.determineDomain(request),
      stakeholders: program.stakeholders,
      constraints: program.constraints,
      timeline: program.timeline
    };

    console.log(`🎯 Getting ${agentType} perspective on: ${program.title}`);

    switch (agentType) {
      case 'business-analyst':
        return await agentSystem.runBusinessAnalyst(context);
      case 'product-manager':
        return await agentSystem.runProductManager(context);
      case 'engineer':
        return await agentSystem.runEngineer(context);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  /**
   * Get all work programs
   */
  getAllWorkPrograms(): WorkProgram[] {
    return Array.from(this.workPrograms.values()).sort(
      (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
    );
  }

  /**
   * Get analyses for a work program
   */
  getAnalyses(programId: string): AgentAnalysis[] {
    return this.analyses.get(programId) || [];
  }

  /**
   * Update work program status
   */
  updateProgramStatus(programId: string, status: WorkProgram['status']): void {
    const program = this.workPrograms.get(programId);
    if (program) {
      program.status = status;
      program.lastUpdated = new Date();
    }
  }

  /**
   * Generate formatted report for a work program
   */
  generateProgramReport(programId: string): string {
    const program = this.workPrograms.get(programId);
    const analyses = this.getAnalyses(programId);

    if (!program) return 'Program not found';

    const latestAnalysis = analyses[analyses.length - 1];

    return `
# Work Program Report: ${program.title}

## Overview
- **Status**: ${program.status.toUpperCase()}
- **Created**: ${program.createdAt.toLocaleDateString()}
- **Last Updated**: ${program.lastUpdated.toLocaleDateString()}
- **Timeline**: ${program.timeline}

## Description
${program.description}

## Objectives
${program.objectives.map(obj => `- ${obj}`).join('\n')}

## Stakeholders
${program.stakeholders.map(stakeholder => `- ${stakeholder}`).join('\n')}

${latestAnalysis ? `
## Latest Agent Analysis (${latestAnalysis.timestamp.toLocaleDateString()})

### Executive Summary
${latestAnalysis.summary}

### Agent Perspectives

#### Business Analyst
${latestAnalysis.agents.find(a => a.agent === 'business-analyst')?.analysis || 'No analysis available'}

#### Product Manager
${latestAnalysis.agents.find(a => a.agent === 'product-manager')?.analysis || 'No analysis available'}

#### Engineer
${latestAnalysis.agents.find(a => a.agent === 'engineer')?.analysis || 'No analysis available'}

### Coordinated Plan
**Timeline**: ${latestAnalysis.coordinatedPlan.timeline}

**Phases**:
${latestAnalysis.coordinatedPlan.phases.map(phase => `- ${phase}`).join('\n')}

**Key Milestones**:
${latestAnalysis.coordinatedPlan.keyMilestones.map(milestone => `- ${milestone}`).join('\n')}

### Recommendations

#### Immediate Actions
${latestAnalysis.recommendations.immediate.map(rec => `- ${rec}`).join('\n')}

#### Short-term Goals
${latestAnalysis.recommendations.shortTerm.map(rec => `- ${rec}`).join('\n')}

#### Long-term Strategy
${latestAnalysis.recommendations.longTerm.map(rec => `- ${rec}`).join('\n')}
` : '## No Analysis Available'}

---
*Generated by BlueSphere Agent System*
    `.trim();
  }

  // Private helper methods

  private generateId(): string {
    return `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineDomain(request: string): ProjectContext['domain'] {
    const requestLower = request.toLowerCase();

    if (requestLower.includes('ocean') || requestLower.includes('marine') || requestLower.includes('sea')) {
      return 'marine-monitoring';
    }
    if (requestLower.includes('data') || requestLower.includes('sensor') || requestLower.includes('analytics')) {
      return 'ocean-data';
    }
    if (requestLower.includes('conservation') || requestLower.includes('wildlife') || requestLower.includes('environment')) {
      return 'conservation';
    }
    if (requestLower.includes('research') || requestLower.includes('science') || requestLower.includes('study')) {
      return 'research';
    }

    return 'general';
  }

  private synthesizeRecommendations(agents: AgentResponse[]): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const allRecommendations = agents.flatMap(agent => agent.recommendations);

    // Simple categorization based on keywords
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    allRecommendations.forEach(rec => {
      const recLower = rec.toLowerCase();
      if (recLower.includes('immediate') || recLower.includes('urgent') || recLower.includes('start')) {
        immediate.push(rec);
      } else if (recLower.includes('plan') || recLower.includes('develop') || recLower.includes('implement')) {
        shortTerm.push(rec);
      } else if (recLower.includes('establish') || recLower.includes('build') || recLower.includes('create')) {
        longTerm.push(rec);
      } else {
        shortTerm.push(rec); // Default to short-term
      }
    });

    return {
      immediate: Array.from(new Set(immediate)), // Remove duplicates
      shortTerm: Array.from(new Set(shortTerm)),
      longTerm: Array.from(new Set(longTerm))
    };
  }
}

// Export singleton instance
export const agentCoordinator = BlueSphereAgentCoordinator.getInstance();