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

        return { cards: updatedCards };
      }),

      getDueCards: (deckId) => {
        const { cards } = get();
        const now = new Date();

        return cards.filter(card => {
          if (deckId && card.deckId !== deckId) return false;

          // If the card is due (due date is in the past) or it's a new card
          const isDue = new Date(card.fsrsCard.due) <= now;
          const isNew = card.fsrsCard.state === State.New;

          return isDue || isNew;
        }).sort((a, b) => new Date(a.fsrsCard.due).getTime() - new Date(b.fsrsCard.due).getTime());
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
