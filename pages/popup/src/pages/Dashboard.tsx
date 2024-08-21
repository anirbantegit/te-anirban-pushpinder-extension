import React, { useEffect, useState } from 'react';
import { PopupLayout } from '@src/components/layout/PopupLayout';
import { videoBlacklistStorage } from '@extension/storage';
import { Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export const Dashboard = () => {
  const [videoId, setVideoId] = useState('');

  const [blacklistedVideos, setBlacklistedVideos] = useState<string[]>(
    videoBlacklistStorage.getSnapshot()?.blacklistedVideoIds || [],
  );

  // Subscribe to changes in the storage
  useEffect(() => {
    const unsubscribe = videoBlacklistStorage.subscribe(() => {
      videoBlacklistStorage.get().then(data => {
        setBlacklistedVideos(data.blacklistedVideoIds);
      });
    });

    // Clean up subscription on component unmount
    return () => unsubscribe();
  }, []);

  const handleAddVideo = async () => {
    if (videoId) {
      await videoBlacklistStorage.addVideoToBlacklist(videoId);
      setVideoId(''); // Clear the input field
    }
  };

  const handleRemoveVideo = async (id: string) => {
    await videoBlacklistStorage.removeVideoFromBlacklist(id);
  };

  return (
    <PopupLayout>
      <div className="flex flex-col space-y-4">
        <h1 className="text-xl font-bold">Blacklisted Videos</h1>
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
          {blacklistedVideos.map(id => (
            <ListItem
              key={id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveVideo(id)}>
                  <DeleteIcon />
                </IconButton>
              }>
              <ListItemText primary={id} />
            </ListItem>
          ))}
        </List>
      </div>
    </PopupLayout>
  );
};
