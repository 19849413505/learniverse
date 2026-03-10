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
        const createdNode = await tx.knowledgeNode.create({
          data: {
            name: nodeData.name,
            description: nodeData.description,
            deckId: deckId,
            microLessons: {
              create: {
                explanation: nodeData.microLesson.explanation,
                example: nodeData.microLesson.example,
                practice: nodeData.microLesson.practice,
              }
            }
          }
        });
        nodeMap.set(nodeData.id, createdNode.id);
      }

      // 2. Create Edges (Prerequisites) based on the mapped IDs
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

      return { success: true, nodesCreated: graph.nodes.length, edgesCreated: graph.edges.length };
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
           microLessons: true
        }
     });

     // Select nodes that have at least one prerequisite (not the absolute beginning)
     // For MVP, randomly select 3-5 of these.
     const midTierNodes = nodes.filter(n => n.prerequisites.length > 0);
     const candidates = midTierNodes.length > 0 ? midTierNodes : nodes;

     // Shuffle and take up to 3
     const selected = candidates.sort(() => 0.5 - Math.random()).slice(0, 3);

     return selected.map(node => ({
        nodeId: node.id,
        name: node.name,
        question: node.microLessons[0]?.practice || 'What do you know about this?'
     }));
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
