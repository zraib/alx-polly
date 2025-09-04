'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';

interface QRCodeComponentProps {
  pollId: string;
  pollTitle: string;
  className?: string;
}

export function QRCodeComponent({ pollId, pollTitle, className }: QRCodeComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pollUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/polls/${pollId}`;

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `poll-${pollId}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for Poll</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly access and vote on "{pollTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <Card className="p-4">
            <CardContent className="p-0">
              <QRCodeSVG
                id="qr-code-canvas"
                value={pollUrl}
                size={200}
                level="M"
                includeMargin
                className="border rounded"
              />
            </CardContent>
          </Card>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground break-all">
              {pollUrl}
            </p>
            <Button onClick={downloadQRCode} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QRCodeComponent;