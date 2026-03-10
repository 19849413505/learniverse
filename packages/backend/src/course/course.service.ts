import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseGraphOutput } from '../ai/agents/course-builder.agent';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Saves the generated Course Graph (Nodes, Edges, MicroLessons) to the database.
   */
  async saveCourseGraph(deckId: string, graph: CourseGraphOutput) {
    this.logger.log(`Saving new course graph for deck: ${deckId}`);

    // We use a transaction to ensure all nodes and edges are created safely
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create all Nodes and their MicroLessons
      const nodeMap = new Map<string, string>(); // Maps original agent ID to new Database UUID

      for (const nodeData of graph.nodes) {
        const steps = nodeData.microLesson?.steps || [];
        const introStep = steps.find(s => s.step_type === 'intro');
        const exampleStep = steps.find(s => s.step_type === 'example');
        const practiceStep = steps.find(s => s.step_type === 'independent_practice' || s.step_type === 'guided_practice');

        const createdNode = await tx.knowledgeNode.create({
          data: {
            name: nodeData.name,
            description: nodeData.description,
            deckId: deckId,
            difficultyLevel: nodeData.difficulty_level,
            roleplayHook: nodeData.roleplay_hook,
            microLessons: {
              create: {
                explanation: introStep?.content || '',
                example: exampleStep?.content || '',
                practice: practiceStep?.content || '',
                steps: nodeData.microLesson?.steps ? JSON.parse(JSON.stringify(nodeData.microLesson.steps)) : []
              }
            }
          }
        });
        nodeMap.set(nodeData.id, createdNode.id);
      }

      // 2. Create Edges based on the mapped IDs
      for (const edge of graph.edges) {
        const sourceDbId = nodeMap.get(edge.source);
        const targetDbId = nodeMap.get(edge.target);

        if (sourceDbId && targetDbId) {
          await tx.knowledgeEdge.create({
            data: {
              sourceId: sourceDbId,
              targetId: targetDbId,
              type: edge.type
            }
          });
        }
      }

      // 3. Create Diagnostic Questions
      for (const dq of graph.diagnostic_questions || []) {
        const targetDbId = nodeMap.get(dq.tests_node_id);
        if (targetDbId) {
          await tx.diagnosticQuestion.create({
            data: {
              nodeId: targetDbId,
              question: dq.question,
              answer: dq.answer
            }
          });
        }
      }

      return { success: true, nodesCreated: graph.nodes.length, edgesCreated: graph.edges.length, diagnosticsCreated: (graph.diagnostic_questions || []).length };
    });
  }

  /**
   * Fetches the Skill Tree for a specific user and deck.
   * This includes all nodes, their prerequisites, and the user's progress.
   */
  async getUserSkillTree(userId: string, deckId: string) {
    const nodes = await this.prisma.knowledgeNode.findMany({
      where: { deckId },
      include: {
        microLessons: true,
        prerequisites: true, // edges where this node is target (what I depend on)
        progress: {
          where: { userId }
        }
      }
    });

    // Decorate the nodes with derived 'isLocked' status based on prerequisites
    const decoratedNodes = nodes.map(node => {
      const userProgress = node.progress[0]?.status || 'locked';

      // A node is considered unlocked if it has no prerequisites, OR if all its prerequisites are 'completed'
      // For MVP, we'll send raw prerequisites to frontend to calculate live locks,
      // or we can calculate the strict server-side state here.

      return {
        ...node,
        userStatus: userProgress
      };
    });

    return decoratedNodes;
  }

  /**
   * Mark a specific node as completed for a user.
   */
  /**
   * Generates a diagnostic test by selecting mid/high tier nodes in the graph.
   * Utilizes AI-generated diagnostic questions if available, falling back to practice questions.
   */
  async generateDiagnosticTest(deckId: string) {
     // Fetch nodes with their dependents (edges where this node is a source)
     // Nodes with many dependents are foundational. Nodes with prerequisites but NO dependents are terminal.
     // A good diagnostic test picks middle-tier nodes to quickly ascertain knowledge boundaries.
     const nodes = await this.prisma.knowledgeNode.findMany({
        where: { deckId },
        include: {
           prerequisites: true,
           dependents: true,
           microLessons: true,
           diagnosticTests: true // Explicitly fetch AI-generated diagnostic questions
        }
     });

     // Prioritize mid-tier (has prerequisites AND dependents) or higher-difficulty nodes
     const midTierNodes = nodes.filter(n => n.prerequisites.length > 0 && n.dependents.length > 0);
     const hardNodes = nodes.filter(n => n.difficultyLevel === 'application' || n.difficultyLevel === 'understanding');

     // Combine unique candidates, fallback to all nodes if graph is too small/shallow
     const combinedCandidates = Array.from(new Set([...midTierNodes, ...hardNodes]));
     const candidates = combinedCandidates.length >= 3 ? combinedCandidates : nodes.filter(n => n.prerequisites.length > 0);
     const finalCandidates = candidates.length > 0 ? candidates : nodes;

     // Shuffle and take up to 5 questions
     const selected = finalCandidates.sort(() => 0.5 - Math.random()).slice(0, 5);

     return selected.map(node => {
        // Prefer the explicitly AI-generated diagnostic question
        let questionText = node.diagnosticTests[0]?.question;
        let answerText = node.diagnosticTests[0]?.answer;

        // Fallback 1: Extract from the JSON 'steps' if it exists
        if (!questionText && node.microLessons[0]?.steps) {
            const steps: any = node.microLessons[0].steps;
            if (Array.isArray(steps)) {
                const practiceStep = steps.find(s => s.step_type === 'independent_practice');
                if (practiceStep) {
                    questionText = practiceStep.content;
                }
            }
        }

        // Fallback 2: Legacy field
        if (!questionText) {
            questionText = node.microLessons[0]?.practice || `What are the core concepts of ${node.name}?`;
        }

        return {
           nodeId: node.id,
           name: node.name,
           question: questionText,
           answer: answerText || 'Self-assessed' // Send answer to frontend if we have it for future features
        };
     });
  }

  /**
   * Process diagnostic results. If a node is passed, mark it and ALL its prerequisites as completed.
   */
  async submitDiagnosticResults(userId: string, deckId: string, passedNodeIds: string[]) {
     const allNodes = await this.prisma.knowledgeNode.findMany({
        where: { deckId },
        include: { prerequisites: true }
     });

     const nodesToComplete = new Set<string>();

     // Recursive function to find all prerequisites
     const findPrereqs = (nodeId: string) => {
        if (nodesToComplete.has(nodeId)) return;
        nodesToComplete.add(nodeId);

        const node = allNodes.find(n => n.id === nodeId);
        if (node) {
           for (const prereq of node.prerequisites) {
              findPrereqs(prereq.sourceId);
           }
        }
     };

     for (const passedId of passedNodeIds) {
        findPrereqs(passedId);
     }

     // Mark all found nodes as completed
     const updatePromises = Array.from(nodesToComplete).map(nodeId =>
        this.completeNode(userId, nodeId)
     );

     await Promise.all(updatePromises);
     return { unlockedCount: nodesToComplete.size };
  }

  async completeNode(userId: string, nodeId: string) {
     // When completing a node for the first time, initialize its FSRS state
     // This allows the system to schedule "implicit" or explicit reviews of this node later
     return this.prisma.nodeProgress.upsert({
       where: {
         userId_nodeId: { userId, nodeId }
       },
       update: {
         status: 'completed'
         // If it's already completed, we might update its FSRS state here later based on performance
       },
       create: {
         userId,
         nodeId,
         status: 'completed',
         due: new Date(),
         stability: 0,
         difficulty: 0,
         elapsedDays: 0,
         scheduledDays: 0,
         reps: 0,
         lapses: 0,
         fsrsState: 0 // New
       }
     });
  }
}
