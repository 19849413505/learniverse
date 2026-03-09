"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatTutor = exports.generateCards = exports.generateGraph = void 0;
const ai_service_1 = require("../services/ai.service");
const aiService = new ai_service_1.AIService();
const generateGraph = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text content is required' });
        }
        const graph = await aiService.generateKnowledgeGraph(text);
        res.json(graph);
    }
    catch (error) {
        console.error('Error generating graph:', error);
        res.status(500).json({ error: 'Failed to generate knowledge graph', details: error.message });
    }
};
exports.generateGraph = generateGraph;
const generateCards = async (req, res) => {
    try {
        const { nodeName, nodeContext } = req.body;
        if (!nodeName) {
            return res.status(400).json({ error: 'nodeName is required' });
        }
        const cards = await aiService.generateFlashcards(nodeName, nodeContext || "");
        res.json({ cards });
    }
    catch (error) {
        console.error('Error generating cards:', error);
        res.status(500).json({ error: 'Failed to generate flashcards', details: error.message });
    }
};
exports.generateCards = generateCards;
const chatTutor = async (req, res) => {
    try {
        const { message, history, context } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'message is required' });
        }
        const reply = await aiService.socraticTutor(message, history || [], context || "");
        res.json({ reply });
    }
    catch (error) {
        console.error('Error in tutor chat:', error);
        res.status(500).json({ error: 'Failed to get tutor response', details: error.message });
    }
};
exports.chatTutor = chatTutor;
