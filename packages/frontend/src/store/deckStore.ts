import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card, FSRS, State, Rating, createEmptyCard } from 'ts-fsrs';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  fsrsCard: Card;
  lastReviewed: string | null;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  cardCount: number;
}

interface DeckState {
  decks: Deck[];
  cards: Flashcard[];
  fsrs: FSRS;

  addDeck: (deck: Deck) => void;
  addCards: (cards: Flashcard[]) => void;
  updateCard: (cardId: string, rating: Rating, log: any) => void;
  getDueCards: (deckId?: string) => Flashcard[];
  fetchCloudDueCards: () => Promise<void>;
  getDeckStats: (deckId: string) => { new: number, learning: number, review: number, total: number };
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      decks: [],
      cards: [],
      fsrs: new FSRS({}), // Initialize FSRS instance

      addDeck: (deck) => set((state) => ({ decks: [...state.decks, deck] })),

      addCards: (newCards) => set((state) => {
        // Find existing deck and update count
        if (newCards.length > 0) {
           const deckId = newCards[0].deckId;
           const updatedDecks = state.decks.map(d =>
             d.id === deckId ? { ...d, cardCount: d.cardCount + newCards.length } : d
           );
           return { cards: [...state.cards, ...newCards], decks: updatedDecks };
        }
        return state;
      }),

      updateCard: (cardId, rating, log) => set((state) => {
        const cardIndex = state.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return state;

        const updatedCards = [...state.cards];
        const card = updatedCards[cardIndex];

        // FSRS calculation (we assume it was calculated in the component, but we store the updated fsrsCard here)
        updatedCards[cardIndex] = {
          ...card,
          fsrsCard: log.card, // the updated card state from FSRS
          lastReviewed: new Date().toISOString(),
        };

        // Background Sync to Backend (Optional Cloud DB)
        // We sync if it looks like a valid backend UUID (length 36 usually)
        // We now use the robust syncBatchReviews endpoint implemented earlier
        if (card.id.length > 20 && !card.id.startsWith('card-deck-')) {
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
            // Need a valid user ID - hardcoded demo-user-id for now as per MVP user auth implementation
            const userId = 'demo-user-id';
            fetch(`${API_BASE}/cards/sync/${userId}`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  reviews: [{
                     cardId: card.id,
                     ...log.card
                  }]
               })
            }).catch(e => console.error("FSRS Cloud Sync failed", e));
        }

        return { cards: updatedCards };
      }),

      getDueCards: (deckId?: string) => {
        const { cards } = get();
        const now = new Date();

        // 1. Filter phase
        const dueCards = cards.filter(card => {
          if (deckId && card.deckId !== deckId) return false;

          // If the card is due (due date is in the past) or it's a new card
          const isDue = new Date(card.fsrsCard.due) <= now;
          const isNew = card.fsrsCard.state === State.New;

          return isDue || isNew;
        });

        // 2. Sorting & Interleaving phase (FSRS optimization)
        return dueCards.sort((a, b) => {
           // If global review, shuffle randomly to force interleaving (context shifting)
           if (!deckId) {
              return Math.random() - 0.5;
           }

           // If specific deck, prioritize learning/relearning over review/new, then sort by due date
           const statePriority: Record<number, number> = {
              [State.Relearning]: 0,
              [State.Learning]: 1,
              [State.Review]: 2,
              [State.New]: 3
           };
           const priorityA = statePriority[a.fsrsCard.state] ?? 4;
           const priorityB = statePriority[b.fsrsCard.state] ?? 4;

           if (priorityA !== priorityB) {
              return priorityA - priorityB;
           }

           // If states are same, sort by due date (most overdue first)
           return new Date(a.fsrsCard.due).getTime() - new Date(b.fsrsCard.due).getTime();
        });
      },

      fetchCloudDueCards: async () => {
         try {
            const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
            const response = await fetch(`${API_BASE}/cards/due/demo-user-id`);
            if (!response.ok) return;

            const dueReviews = await response.json();

            // Map backend CardReview models to frontend Flashcard structure
            const cloudCards = dueReviews.map((review: any) => ({
               id: review.id, // using review ID as tracking ID for updates
               front: review.card.front,
               back: review.card.back,
               deckId: review.card.sourceNode || 'cloud-deck',
               fsrsCard: {
                  due: new Date(review.due),
                  stability: review.stability,
                  difficulty: review.difficulty,
                  elapsed_days: review.elapsedDays,
                  scheduled_days: review.scheduledDays,
                  reps: review.reps,
                  lapses: review.lapses,
                  state: review.state,
                  last_review: review.updatedAt ? new Date(review.updatedAt) : new Date()
               },
               lastReviewed: review.updatedAt
            }));

            // Merge with local cards (naive merge for MVP)
            set((state) => {
               const existingIds = new Set(state.cards.map(c => c.id));
               const newCloudCards = cloudCards.filter((c: any) => !existingIds.has(c.id));
               return { cards: [...state.cards, ...newCloudCards] };
            });

         } catch (e) {
            console.error("Failed to fetch cloud due cards", e);
         }
      },

      getDeckStats: (deckId) => {
        const { cards } = get();
        const deckCards = cards.filter(c => c.deckId === deckId);

        let stats = { new: 0, learning: 0, review: 0, total: deckCards.length };
        const now = new Date();

        deckCards.forEach(card => {
          const isDue = new Date(card.fsrsCard.due) <= now;

          if (card.fsrsCard.state === State.New) {
            stats.new++;
          } else if (card.fsrsCard.state === State.Learning || card.fsrsCard.state === State.Relearning) {
            if (isDue) stats.learning++;
          } else if (card.fsrsCard.state === State.Review) {
             if (isDue) stats.review++;
          }
        });

        return stats;
      }
    }),
    {
      name: 'learniverse-deck-storage',
      partialize: (state) => ({ decks: state.decks, cards: state.cards }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.fsrs = new FSRS({});
          state.cards = state.cards.map((card) => {
            if (card.fsrsCard.due) {
               card.fsrsCard.due = new Date(card.fsrsCard.due);
            }
            if (card.fsrsCard.last_review) {
              card.fsrsCard.last_review = new Date(card.fsrsCard.last_review);
            }
            return card;
          });
        }
      }
    }
  )
);
