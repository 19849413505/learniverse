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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CardsService = class CardsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createFlashcard(data) {
        return this.prisma.flashcard.create({
            data,
        });
    }
    async getAllFlashcards() {
        return this.prisma.flashcard.findMany();
    }
    // Assign a card to a user with initial FSRS state
    async createReviewState(userId, cardId) {
        return this.prisma.cardReview.create({
            data: {
                userId,
                cardId,
                // Default FSRS Initial Values
                due: new Date(),
                stability: 0,
                difficulty: 0,
                elapsedDays: 0,
                scheduledDays: 0,
                reps: 0,
                lapses: 0,
                state: 0, // New
            },
        });
    }
    async getUserDueCards(userId) {
        const now = new Date();
        return this.prisma.cardReview.findMany({
            where: {
                userId,
                due: {
                    lte: now, // lte = less than or equal to current time
                },
            },
            include: {
                card: true,
            },
            orderBy: {
                due: 'asc',
            },
        });
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CardsService);
