import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';

const aiService = new AIService();

export const generateGraph = async (req: Request, res: Response) => {
  try {
    const { text, customConfig } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const graph = await aiService.generateKnowledgeGraph(text, customConfig);
    res.json(graph);
  } catch (error: any) {
    console.error('Error generating graph:', error);
    res.status(500).json({ error: 'Failed to generate knowledge graph', details: error.message });
  }
};

export const generateCards = async (req: Request, res: Response) => {
  try {
    const { nodeName, nodeContext, customConfig } = req.body;
    if (!nodeName) {
      return res.status(400).json({ error: 'nodeName is required' });
    }

    const cards = await aiService.generateFlashcards(nodeName, nodeContext || "", customConfig);
    res.json({ cards });
  } catch (error: any) {
    console.error('Error generating cards:', error);
    res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
  }
};

export const chatTutor = async (req: Request, res: Response) => {
  try {
    const { message, history, context, customConfig } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const reply = await aiService.socraticTutor(message, history || [], context || "", customConfig);
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in tutor chat:', error);
    res.status(500).json({ error: 'Failed to get tutor response', details: error.message });
  }
};
