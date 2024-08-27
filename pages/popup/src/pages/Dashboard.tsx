import React, { useEffect, useState } from 'react';
import { PopupLayout } from '@src/components/layout/PopupLayout';
import { videoBlacklistStorage } from '@extension/storage';
import { Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export const Dashboard = () => {
  const [videoId, setVideoId] = useState('');
  const [contentFilter, setContentFilter] = useState('');
  const [blacklistedVideos, setBlacklistedVideos] = useState<string[]>(
    videoBlacklistStorage.getSnapshot()?.blacklistedVideoIds || [],
  );
  const [accordian, setAccordian] = useState(false);

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
      <div className="flex flex-col space-y-3">
        <div className='w-full'>
          <h4 className="text-sm font-medium mb-1">Filter</h4>
          <textarea
            placeholder="Type your filter instruction here"
            value={contentFilter}
            onChange={e => setContentFilter(e.target.value)}
            className='w-full h-[60px] resize-none bg-white rounded-lg px-2 py-1.5'
          />
        </div>
        <div className='w-full'>
          <div className='bg-white rounded-lg'>
            <div className={accordian ? 'p-4 flex justify-between items-center gap-2 border-b-[#f0f0f0] border-b border-solid': 'p-4 flex justify-between items-center gap-2'}>
              <div className='flex-auto'>
                <h4 className="text-sm font-medium">Blocked 4/32 Videos</h4>
              </div>
              <button type='button' className='flex-[0_0_auto]' onClick={() => setAccordian(!accordian)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={12}
                  height={12}
                  fill="currentColor"
                  className={accordian ? "bi bi-chevron-down transition-[0.5s] rotate-180": "bi bi-chevron-down transition-[0.5s]"}
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
                  />
                </svg>
              
              </button>
            </div>
            {accordian &&
              <div className='p-4'>
                <div className='flex flex-col space-y-3 '>

                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>

                  </div>
                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>

                  </div>
                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>

                  </div>

                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>
                  </div>

                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>
                  </div>

                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>
                  </div>

                  <div className='border-b-[#f0f0f0] border-b border-solid'>
                    <div className='flex gap-[10px]'>
                      <div className='w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center'>
                        <svg
                          className='w-[20px]'
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          version="1.1"
                          id="Layer_1"
                          x="0px"
                          y="0px"
                          viewBox="0 0 512 512"
                          xmlSpace="preserve"
                        >
                          <g>
                            <g>
                              <g>
                                <path d="M256,0C114.833,0,0,114.844,0,256s114.833,256,256,256s256-114.844,256-256S397.167,0,256,0z M256,490.667     C126.604,490.667,21.333,385.396,21.333,256S126.604,21.333,256,21.333S490.667,126.604,490.667,256S385.396,490.667,256,490.667     z" />
                                <path d="M357.771,247.031l-149.333-96c-3.271-2.135-7.5-2.25-10.875-0.396C194.125,152.51,192,156.094,192,160v192     c0,3.906,2.125,7.49,5.563,9.365c1.583,0.865,3.354,1.302,5.104,1.302c2,0,4.021-0.563,5.771-1.698l149.333-96     c3.042-1.958,4.896-5.344,4.896-8.969S360.813,248.99,357.771,247.031z M213.333,332.458V179.542L332.271,256L213.333,332.458z" />
                              </g>
                            </g>
                          </g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                          <g></g>
                        </svg>
                      </div>
                      <div className='flex-auto'>
                        <h4 className="text-sm font-medium ">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h4>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            }
          </div>
        </div>
        {/* <div>
          <h4 className="text-sm font-medium mb-1">Blacklisted Videos</h4>
          <TextField
            label="Video ID"
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
            variant="outlined"
            fullWidth
          />
        </div>
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
        </List> */}
      </div>
    </PopupLayout>
  );
};
