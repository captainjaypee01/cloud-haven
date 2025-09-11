import React, { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Link, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { SUPPORT_EMAIL } from '@/constants/AppConstant';

const SocialShare = ({ 
  url, 
  title, 
  description,
  // image,
  hashtags = ['NetaniaDeLayia', 'LayiaResort', 'BeachResort', 'Batangas']
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Ensure absolute URLs
  const shareUrl = url?.startsWith('http') ? url : `https://www.netaniadelaiya.com${url || ''}`;
  const shareTitle = title || 'Netania De Laiya - Beachfront Resort in Laiya, Batangas';
  const shareDescription = description || 'Experience paradise at Netania De Laiya resort. Book your beachfront getaway today!';
  // const shareImage = image?.startsWith('http') ? image : `https://www.netaniadelaiya.com${image || '/og-home.jpg'}`;

  // Social share URLs
  const socialPlatforms = {
    facebook: {
      name: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`
    },
    twitter: {
      name: 'Twitter',
      icon: <Twitter className="w-4 h-4" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}&hashtags=${hashtags.join(',')}`
    },
    whatsapp: {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      url: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`
    },
    email: {
      name: 'Email',
      icon: <Mail className="w-4 h-4" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareDescription}\n\n${shareUrl}\n\nFor reservations, call: +63 949 798 9831\nEmail: ${SUPPORT_EMAIL}`)}`
    }
  };

  const handleShare = async (platform) => {
    setIsLoading(true);
    
    try {
      // Check if Web Share API is available (mobile devices)
      if (platform === 'native' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } else if (platform === 'copy') {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } else {
        // Open social platform
        const socialUrl = socialPlatforms[platform]?.url;
        if (socialUrl) {
          window.open(socialUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
          toast.success(`Shared to ${socialPlatforms[platform].name}!`);
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isLoading}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Native share for mobile */}
        {navigator.share && (
          <DropdownMenuItem onClick={() => handleShare('native')}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}
        
        {/* Social platforms */}
        {Object.entries(socialPlatforms).map(([key, platform]) => (
          <DropdownMenuItem key={key} onClick={() => handleShare(key)}>
            {platform.icon}
            <span className="ml-2">{platform.name}</span>
          </DropdownMenuItem>
        ))}
        
        {/* Copy link */}
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Link className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShare;
