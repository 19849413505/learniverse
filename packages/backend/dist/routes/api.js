"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const knowledge_controller_1 = require("../controllers/knowledge.controller");
const router = (0, express_1.Router)();
// Endpoint to generate knowledge graph from document text
router.post('/knowledge/graph', knowledge_controller_1.generateGraph);
// Endpoint to generate flashcards for a specific knowledge node
router.post('/knowledge/cards', knowledge_controller_1.generateCards);
// Endpoint for Socratic Tutoring Chat
router.post('/archimedes/chat', knowledge_controller_1.chatTutor);
exports.default = router;
