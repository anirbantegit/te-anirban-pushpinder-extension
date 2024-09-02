import React, { useState, useEffect } from 'react';
import { TextField, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { blacklistedVideosStorage } from '@extension/storage/lib';

interface VideoManagerProps {}

export const VideoManager: React.FC<VideoManagerProps> = () => {
  const [videoId, setVideoId] = useState('');
  const [blacklistedVideos, setBlacklistedVideos] = useState<string[]>([]);

  useEffect(() => {
    // Initialize blacklisted videos
    const initializeBlacklistedVideos = async () => {
      const data = await blacklistedVideosStorage.get();
      setBlacklistedVideos(data?.videoIdsToBeBlacklisted || []);
    };

    initializeBlacklistedVideos();

    // Subscribe to live updates
    const unsubscribe = blacklistedVideosStorage.subscribe(async () => {
      const data = await blacklistedVideosStorage.get();
      setBlacklistedVideos(data?.videoIdsToBeBlacklisted || []);
    });

    return () => unsubscribe();
  }, []);

  const handleAddVideo = async () => {
    if (videoId) {
      await blacklistedVideosStorage.addVideoToBlacklist(videoId);
      setVideoId('');
    }
  };

  const handleRemoveVideo = async (id: string) => {
    await blacklistedVideosStorage.removeVideoFromBlacklist(id);
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-1">Blacklisted Videos</h4>
      <TextField
        label="Video ID"
        value={videoId}
        onChange={e => setVideoId(e.target.value)}
        variant="outlined"
        fullWidth
      />
      <Button variant="contained" color="primary" onClick={handleAddVideo} disabled={!videoId}>
        Add to Blacklist
      </Button>
      <List>
        {blacklistedVideos.length > 0 ? (
          blacklistedVideos.map(id => (
            <ListItem
              key={id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveVideo(id)}>
                  <DeleteIcon />
                </IconButton>
              }>
              <ListItemText primary={id} />
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText primary="No videos blacklisted." />
          </ListItem>
        )}
      </List>
    </div>
  );
};
