'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';

export const TestCardInfo = () => {
  const [copied, setCopied] = useState(false);

  const testCards = [
    {
      name: 'Successful Payment',
      number: '4242 4242 4242 4242',
      description: 'Use this card for successful payments',
    },
    {
      name: 'Failed Payment',
      number: '4000 0000 0000 0002',
      description: 'Use this card to test failed payments',
    },
    {
      name: '3D Secure Required',
      number: '4000 0000 0000 3220',
      description: 'Use this card to test 3D Secure authentication',
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Test Card Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testCards.map((card) => (
            <div key={card.number} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{card.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(card.number)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {card.number}
              </p>
            </div>
          ))}
          <p className="text-sm text-muted-foreground mt-4">
            For all test cards, use any future expiration date and any 3-digit CVC.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
