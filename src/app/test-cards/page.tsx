'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavMenu } from '@/components/nav-menu';

const TEST_CARDS = [
  {
    name: 'Successful Payment',
    number: '4242 4242 4242 4242',
    description: 'This card will always succeed',
    details: 'Use any future expiration date, any 3-digit CVC, and any postal code',
  },
  {
    name: 'Failed Payment',
    number: '4000 0000 0000 0002',
    description: 'This card will always be declined',
    details: 'Use any future expiration date, any 3-digit CVC, and any postal code',
  },
  {
    name: '3D Secure Authentication',
    number: '4000 0000 0000 3220',
    description: 'This card requires additional authentication',
    details: 'Use any future expiration date, any 3-digit CVC, and any postal code',
  },
  {
    name: 'Insufficient Funds',
    number: '4000 0000 0000 9995',
    description: 'This card will be declined due to insufficient funds',
    details: 'Use any future expiration date, any 3-digit CVC, and any postal code',
  },
  {
    name: 'Lost Card',
    number: '4000 0000 0000 9987',
    description: 'This card will be declined as it is reported lost',
    details: 'Use any future expiration date, any 3-digit CVC, and any postal code',
  },
  {
    name: 'Stolen Card',
    number: '4000 0000 0000 9979',
    description: 'This card will be declined as it is reported stolen',
    details: 'Use any future expiration date, any 3-digit CVC, and any postal code',
  },
];

export default function TestCardsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Card Information</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEST_CARDS.map((card) => (
          <Card key={card.number} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{card.name}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-mono text-lg">{card.number}</p>
                </div>
                <p className="text-sm text-muted-foreground">{card.details}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How to Use Test Cards</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Go to the Payment page</li>
          <li>Select an item to purchase</li>
          <li>Click the "Purchase" button</li>
          <li>Enter one of the test card numbers above</li>
          <li>Use any future expiration date</li>
          <li>Use any 3-digit CVC</li>
          <li>Use any postal code</li>
          <li>Click "Pay" to process the payment</li>
        </ol>
      </div>
    </div>
  );
}
