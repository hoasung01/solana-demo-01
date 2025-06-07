'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusIcon, LinkIcon, UnlinkIcon, TrashIcon } from 'lucide-react';
import { NewCardModal } from './new-card-modal';
import { useStakePool } from '@/hooks/use-stake-pool';
import { toast } from 'sonner';

interface CreditCard {
  id: string;
  number: string;
  type: string;
  status: 'linked' | 'unlinked';
}

export function CardList() {
  const { publicKey, connected } = useWallet();
  const { linkCard, unlinkCard, getStakeInfo } = useStakePool();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCards = async () => {
      if (!connected || !publicKey) return;

      try {
        setLoading(true);
        const stakeInfo = await getStakeInfo();
        if (stakeInfo) {
          // Update card statuses based on linkedCards
          setCards(prevCards =>
            prevCards.map(card => ({
              ...card,
              status: stakeInfo.linkedCards?.some(c => c.id === card.id)
                ? 'linked'
                : 'unlinked'
            }))
          );
        }
      } catch (err) {
        console.error('Error loading cards:', err);
        toast.error('Failed to load cards');
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [connected, publicKey, getStakeInfo]);

  const handleLinkCard = async (cardId: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      const card = cards.find(c => c.id === cardId);
      if (!card) {
        throw new Error('Card not found');
      }

      const success = await linkCard(cardId, card.number, '123'); // In a real app, we'd use the actual CVV
      if (success) {
        setCards(prevCards =>
          prevCards.map(c =>
            c.id === cardId ? { ...c, status: 'linked' } : c
          )
        );
        toast.success('Card linked successfully');
      } else {
        throw new Error('Failed to link card');
      }
    } catch (err) {
      console.error('Error linking card:', err);
      toast.error('Failed to link card');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCard = async (cardId: string) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      const success = await unlinkCard();
      if (success) {
        setCards(prevCards =>
          prevCards.map(c =>
            c.id === cardId ? { ...c, status: 'unlinked' } : c
          )
        );
        toast.success('Card unlinked successfully');
      } else {
        throw new Error('Failed to unlink card');
      }
    } catch (err) {
      console.error('Error unlinking card:', err);
      toast.error('Failed to unlink card');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = (card: { type: string; number: string }) => {
    const newCard: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      type: card.type,
      number: card.number,
      status: 'unlinked',
    };
    setCards(prevCards => [...prevCards, newCard]);
    setShowNewCardModal(false);
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to manage cards</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Credit Cards</h2>
        <Button
          onClick={() => setShowNewCardModal(true)}
          disabled={loading}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      <div className="grid gap-4">
        {cards.map(card => (
          <Card key={card.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">**** **** **** {card.number}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {card.status}
                </p>
              </div>
              <div className="space-x-2">
                {card.status === 'unlinked' ? (
                  <Button
                    variant="outline"
                    onClick={() => handleLinkCard(card.id)}
                    disabled={loading}
                  >
                    Link
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleUnlinkCard(card.id)}
                    disabled={loading}
                  >
                    Unlink
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCards(prevCards =>
                      prevCards.filter(c => c.id !== card.id)
                    );
                  }}
                  disabled={loading}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <NewCardModal
        open={showNewCardModal}
        onOpenChange={setShowNewCardModal}
        onCardAdded={handleAddCard}
      />
    </div>
  );
}
