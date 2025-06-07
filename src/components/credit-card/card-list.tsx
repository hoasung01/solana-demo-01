'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusIcon, LinkIcon, UnlinkIcon } from 'lucide-react';
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
    const fetchStakeInfo = async () => {
      if (!connected || !publicKey) return;

      try {
        const stakeInfo = await getStakeInfo();
        if (stakeInfo) {
          // Update cards with linked status from stake pool
          setCards(prevCards =>
            prevCards.map(card => ({
              ...card,
              status: stakeInfo.linkedCards.some(c => c.id === card.id)
                ? 'linked'
                : 'unlinked'
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching stake info:', error);
      }
    };

    fetchStakeInfo();
  }, [connected, publicKey, getStakeInfo]);

  const handleLinkCard = async (cardId: string) => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const success = await linkCard(cardId);
      if (success) {
        setCards(cards.map(card =>
          card.id === cardId
            ? { ...card, status: 'linked' }
            : card
        ));
        toast.success('Card linked successfully');
      } else {
        toast.error('Failed to link card');
      }
    } catch (error) {
      console.error('Error linking card:', error);
      toast.error('Error linking card');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCard = async (cardId: string) => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const success = await unlinkCard(cardId);
      if (success) {
        setCards(cards.map(card =>
          card.id === cardId
            ? { ...card, status: 'unlinked' }
            : card
        ));
        toast.success('Card unlinked successfully');
      } else {
        toast.error('Failed to unlink card');
      }
    } catch (error) {
      console.error('Error unlinking card:', error);
      toast.error('Error unlinking card');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = (card: { type: string; number: string }) => {
    const newCard: CreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      type: card.type.charAt(0).toUpperCase() + card.type.slice(1),
      number: card.number,
      status: 'unlinked',
    };
    setCards([...cards, newCard]);
    toast.success('Card added successfully');
  };

  if (!connected) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Connect your wallet to manage credit cards
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Credit Cards</h2>
        <Button
          onClick={() => setShowNewCardModal(true)}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <PlusIcon className="w-4 h-4" />
          Add New Card
        </Button>
      </div>

      <div className="grid gap-4">
        {cards.map((card) => (
          <Card key={card.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{card.type} ****{card.number}</h3>
                <p className="text-sm text-muted-foreground">
                  Status: {card.status}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  card.status === 'linked'
                    ? handleUnlinkCard(card.id)
                    : handleLinkCard(card.id)
                }
                className="flex items-center gap-2"
                disabled={loading}
              >
                {card.status === 'linked' ? (
                  <>
                    <UnlinkIcon className="w-4 h-4" />
                    Unlink
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    Link
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}

        {cards.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No credit cards added yet
          </div>
        )}
      </div>

      <NewCardModal
        open={showNewCardModal}
        onOpenChange={setShowNewCardModal}
        onCardAdded={handleAddCard}
      />
    </div>
  );
}
