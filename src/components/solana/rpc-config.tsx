'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RPCConfigProps {
  currentEndpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

export function RPCConfig({ currentEndpoint, onEndpointChange }: RPCConfigProps) {
  const [endpoint, setEndpoint] = useState(currentEndpoint);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    try {
      // Basic validation
      new URL(endpoint);
      onEndpointChange(endpoint);
      setIsEditing(false);
      toast.success('RPC endpoint updated');
    } catch (error) {
      toast.error('Invalid RPC endpoint URL');
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">RPC Configuration</h3>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">RPC Endpoint</Label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.devnet.solana.com"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button
              variant="outline"
              onClick={() => {
                setEndpoint(currentEndpoint);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Endpoint</Label>
            <p className="text-sm text-muted-foreground break-all">
              {currentEndpoint}
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)}>Change Endpoint</Button>
        </div>
      )}
    </Card>
  );
}
