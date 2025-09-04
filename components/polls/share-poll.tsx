'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from 'lucide-react';

interface SharePollProps {
  pollId: string;
  pollTitle: string;
  className?: string;
}

export function SharePoll({ pollId, pollTitle, className }: SharePollProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const pollUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/polls/${pollId}`;
  const shareText = `Check out this poll: "${pollTitle}"`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Poll link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pollUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pollUrl)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pollTitle,
          text: shareText,
          url: pollUrl,
        });
      } catch (err) {
        // User cancelled sharing or sharing failed
        console.log('Sharing cancelled or failed');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Poll</DialogTitle>
          <DialogDescription>
            Share "{pollTitle}" with others so they can vote
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="poll-url">Poll Link</Label>
            <div className="flex space-x-2">
              <Input
                id="poll-url"
                value={pollUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={copyToClipboard}
                className="px-3"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-2">
            <Label>Share on Social Media</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={shareOnTwitter}
                className="flex-1"
              >
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={shareOnFacebook}
                className="flex-1"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={shareOnLinkedIn}
                className="flex-1"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </div>

          {/* Native Share (if supported) */}
          {typeof window !== 'undefined' && typeof navigator.share === 'function' && (
            <Button
              type="button"
              onClick={shareNative}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via Device
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SharePoll;