import { Router } from 'express';
import { generateGraph, generateCards, chatTutor } from '../controllers/knowledge.controller';

const router = Router();

// Endpoint to generate knowledge graph from document text
router.post('/knowledge/graph', generateGraph);

// Endpoint to generate flashcards for a specific knowledge node
router.post('/knowledge/cards', generateCards);

// Endpoint for Socratic Tutoring Chat
router.post('/archimedes/chat', chatTutor);

export default router;
