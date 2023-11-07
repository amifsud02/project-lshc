'use client';

import React from 'react';

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
  
    return(
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        
    ></iframe>
    );
  };
  