"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const swagger_1 = require("@nestjs/swagger");
let AiController = class AiController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async generateGraph(body) {
        if (!body.text) {
            return { error: 'Text content is required' };
        }
        return this.aiService.generateKnowledgeGraph(body.text, body.customConfig);
    }
    async generateCards(body) {
        if (!body.nodeName) {
            return { error: 'nodeName is required' };
        }
        const cards = await this.aiService.generateFlashcards(body.nodeName, body.nodeContext || '', body.customConfig);
        return { cards };
    }
    async chatTutor(body) {
        if (!body.message) {
            return { error: 'message is required' };
        }
        const reply = await this.aiService.socraticTutor(body.message, body.history || [], body.context || '', body.customConfig);
        return { reply };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('knowledge/graph'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateGraph", null);
__decorate([
    (0, common_1.Post)('knowledge/cards'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateCards", null);
__decorate([
    (0, common_1.Post)('archimedes/chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chatTutor", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('Knowledge & AI'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
