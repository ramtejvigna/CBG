'use client';

import React from 'react';
import { useUserImage } from '@/hooks/useUserImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface UserAvatarProps {
  userId?: string;
  userName?: string;
  hasImage?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSkeleton?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  userName = 'User',
  hasImage = false,
  size = 'md',
  className = '',
  showSkeleton = true,
}) => {
  const { image, loading } = useUserImage(hasImage ? userId : undefined);

  // Show skeleton while loading if enabled
  if (loading && showSkeleton) {
    return (
      <Skeleton className={`${sizeClasses[size]} rounded-full ${className}`} />
    );
  }

  // Get user initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {image && <AvatarImage src={image} alt={userName} />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials(userName)}
      </AvatarFallback>
    </Avatar>
  );
};