'use client';

import React from 'react';
import YouTube from 'react-youtube';

interface VideoPlayerProps {
    videoId: string;
}

export const YouTubePlayer: React.FC<VideoPlayerProps> = ({videoId}) => {
    // Set up event handlers
    const onReady = (event: any) => {
      // Access the player instance
      const player = event.target;
  
      // For example, you can automatically play the video
      player.playVideo();
    };
  
    const onError = (error: any) => {
      console.error('YouTube Player Error:', error);
    };
  
    return (
      <YouTube
        className='mx-auto'
        videoId={videoId}
        onReady={onReady}
        onError={onError}
      />
    );
  };
  