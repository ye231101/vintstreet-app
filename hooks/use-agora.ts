import { clearAgoraConfigCache, getAgoraConfig } from '@/api/config/agora';
import { useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  IRtcEngineEventHandler,
  RemoteAudioState,
  RemoteAudioStateReason,
  RemoteVideoState,
  RemoteVideoStateReason,
  RtcConnection,
  UserOfflineReasonType,
} from 'react-native-agora';

interface UseAgoraProps {
  channelName: string;
  userId?: string;
  isHost?: boolean;
}

interface AgoraState {
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  remoteUsers: number[];
  configLoaded: boolean;
  configError: string | null;
}

export const useAgora = ({ channelName, userId, isHost = false }: UseAgoraProps) => {
  const [state, setState] = useState<AgoraState>({
    isConnected: false,
    isVideoEnabled: false,
    isAudioEnabled: false,
    remoteUsers: [],
    configLoaded: false,
    configError: null,
  });

  const [agoraConfig, setAgoraConfig] = useState<any>(null);
  const engineRef = useRef<IRtcEngine | null>(null);
  const remoteUsersRef = useRef<Set<number>>(new Set());
  const uidRef = useRef<number | null>(null);
  const initializingRef = useRef(false);

  // Request Android permissions
  const getPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    }
  };

  // Load Agora configuration
  useEffect(() => {
    if (!channelName) {
      return;
    }

    const loadConfig = async () => {
      try {
        console.log('Loading Agora configuration...');
        if (uidRef.current == null) {
          uidRef.current = userId ? parseInt(userId) : Math.floor(Math.random() * 10000);
        }
        const config = await getAgoraConfig({
          channelName,
          uid: uidRef.current!,
          role: isHost ? 'host' : 'audience',
        });
        console.log('Agora config loaded:', { appId: config.appId, hasToken: !!config.token });

        // Validate App ID format on frontend
        if (!config.appId || !/^[a-f0-9]{32}$/i.test(config.appId)) {
          throw new Error(`Invalid App ID format: ${config.appId}. Expected 32 hexadecimal characters.`);
        }

        setAgoraConfig(config);
        setState((prev) => ({ ...prev, configLoaded: true, configError: null }));
      } catch (error) {
        console.error('Failed to load Agora config:', error);
        setState((prev) => ({
          ...prev,
          configLoaded: false,
          configError: error instanceof Error ? error.message : 'Failed to load configuration',
        }));
      }
    };

    loadConfig();

    // Clear config cache on unmount
    return () => {
      clearAgoraConfigCache();
    };
  }, [channelName, userId, isHost]);

  useEffect(() => {
    if (!channelName || !agoraConfig || !state.configLoaded) {
      console.log('Waiting for channel name and Agora config...', { channelName, configLoaded: state.configLoaded });
      return;
    }

    if (engineRef.current || initializingRef.current) {
      console.log('Agora engine already exists or initializing, skipping...');
      return;
    }

    const initializeAgora = async () => {
      try {
        console.log('Initializing Agora engine with config:', { appId: agoraConfig.appId });
        initializingRef.current = true;

        // Request permissions for Android
        if (Platform.OS === 'android') {
          await getPermission();
        }

        // Create Agora engine
        const engine = RtcEngine();
        await engine.initialize({ appId: agoraConfig.appId });
        engineRef.current = engine;

        // Set channel profile to live streaming
        await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

        // Set client role (host or audience)
        await engine.setClientRole(isHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience);

        // Enable video
        await engine.enableVideo();

        // Enable audio
        await engine.enableAudio();

        // Setup local video function (for host after joining)
        const setupLocalVideo = async () => {
          if (!isHost) return;
          try {
            console.log('Setting up local video...');
            await engine.startPreview();
            await engine.enableLocalVideo(true);
            setState((prev) => ({
              ...prev,
              isVideoEnabled: true,
            }));
            console.log('Local video setup successfully');
          } catch (error) {
            console.error('Failed to setup local video:', error);
          }
        };

        // Set up event handlers
        const eventHandlers: IRtcEngineEventHandler = {
          onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
            console.log('Successfully joined Agora channel:', {
              channel: connection.channelId,
              uid: connection.localUid,
              elapsed,
            });
            setState((prev) => ({
              ...prev,
              isConnected: true,
              configError: null,
            }));
            // Setup local video for host after joining
            if (isHost) {
              setupLocalVideo();
            }
          },
          onLeaveChannel: (connection: RtcConnection, stats: any) => {
            console.log('Left Agora channel:', { channel: connection.channelId, stats });
            setState((prev) => ({
              ...prev,
              isConnected: false,
              isVideoEnabled: false,
              isAudioEnabled: false,
            }));
          },
          onError: (err: number, msg: string) => {
            console.error('Agora engine error:', { err, msg });
            setState((prev) => ({
              ...prev,
              configError: `Agora error ${err}: ${msg}`,
            }));
          },
          onUserJoined: (connection: RtcConnection, remoteUid: number, elapsed: number) => {
            console.log('Remote user joined:', { remoteUid, elapsed });
            remoteUsersRef.current.add(remoteUid);
            setState((prev) => ({
              ...prev,
              remoteUsers: Array.from(remoteUsersRef.current),
            }));
          },
          onUserOffline: (connection: RtcConnection, remoteUid: number, reason: UserOfflineReasonType) => {
            console.log('Remote user offline:', { remoteUid, reason });
            remoteUsersRef.current.delete(remoteUid);
            setState((prev) => ({
              ...prev,
              remoteUsers: Array.from(remoteUsersRef.current),
            }));
          },
          onRemoteVideoStateChanged: (
            connection: RtcConnection,
            remoteUid: number,
            state: RemoteVideoState,
            reason: RemoteVideoStateReason,
            elapsed: number
          ) => {
            console.log('Remote video state changed:', { remoteUid, state, reason, elapsed });
          },
          onRemoteAudioStateChanged: (
            connection: RtcConnection,
            remoteUid: number,
            state: RemoteAudioState,
            reason: RemoteAudioStateReason,
            elapsed: number
          ) => {
            console.log('Remote audio state changed:', { remoteUid, state, reason, elapsed });
          },
        };

        // Register event handlers
        engine.registerEventHandler(eventHandlers);

        // Join channel
        const uid = uidRef.current ?? (userId ? parseInt(userId) : Math.floor(Math.random() * 10000));
        if (uidRef.current == null) uidRef.current = uid;
        console.log('Joining Agora channel:', {
          channelName,
          uid,
          appId: agoraConfig.appId,
          tokenPresent: !!agoraConfig.token,
        });

        try {
          await engine.joinChannel(agoraConfig.token || '', channelName, uid, {
            clientRoleType: isHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience,
          });
          console.log('Successfully joined Agora channel:', channelName);
        } catch (joinError: any) {
          console.error('Failed to join Agora channel:', joinError);
          // If the error is about gateway server, log more details
          if (joinError.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
            console.error('Gateway server error - this usually indicates:');
            console.error('1. Invalid App ID');
            console.error('2. Token configuration mismatch');
            console.error('3. Network connectivity issues');
          }
          throw joinError;
        }
      } catch (error) {
        console.error('Failed to initialize Agora:', error);
        setState((prev) => ({
          ...prev,
          configError: error instanceof Error ? error.message : 'Failed to initialize Agora',
        }));
      } finally {
        initializingRef.current = false;
      }
    };

    initializeAgora();

    // Cleanup function
    return () => {
      if (engineRef.current) {
        console.log('Cleaning up Agora engine...');
        try {
          engineRef.current.leaveChannel();
          engineRef.current.removeAllListeners();
          engineRef.current.release();
        } catch (error) {
          console.error('Error during Agora cleanup:', error);
        }
        engineRef.current = null;
      }
      initializingRef.current = false;
      remoteUsersRef.current.clear();
    };
  }, [channelName, userId, isHost, agoraConfig, state.configLoaded]);

  const startVideo = async () => {
    if (!engineRef.current || !isHost) {
      console.log('Cannot start video: engine not ready or not host', { hasEngine: !!engineRef.current, isHost });
      return;
    }

    if (!state.isConnected) {
      console.log('Cannot start video: not connected to channel yet');
      throw new Error('Not connected to channel yet. Please wait for connection.');
    }

    try {
      console.log('Starting camera...');
      await engineRef.current.startPreview();
      await engineRef.current.enableLocalVideo(true);

      setState((prev) => ({
        ...prev,
        isVideoEnabled: true,
      }));

      console.log('Video started successfully');
    } catch (error) {
      console.error('Failed to start video:', error);
      throw error;
    }
  };

  const stopVideo = async () => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.enableLocalVideo(false);
      await engineRef.current.stopPreview();

      setState((prev) => ({
        ...prev,
        isVideoEnabled: false,
      }));
    } catch (error) {
      console.error('Failed to stop video:', error);
    }
  };

  const startAudio = async () => {
    if (!engineRef.current || !isHost) {
      console.log('Cannot start audio: engine not ready or not host', { hasEngine: !!engineRef.current, isHost });
      return;
    }

    if (!state.isConnected) {
      console.log('Cannot start audio: not connected to channel yet');
      throw new Error('Not connected to channel yet. Please wait for connection.');
    }

    try {
      console.log('Starting microphone...');
      await engineRef.current.enableLocalAudio(true);

      setState((prev) => ({
        ...prev,
        isAudioEnabled: true,
      }));

      console.log('Audio started successfully');
    } catch (error) {
      console.error('Failed to start audio:', error);
      throw error;
    }
  };

  const stopAudio = async () => {
    if (!engineRef.current) return;

    try {
      await engineRef.current.enableLocalAudio(false);

      setState((prev) => ({
        ...prev,
        isAudioEnabled: false,
      }));
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  };

  const switchCamera = async () => {
    if (!engineRef.current || !isHost) {
      console.log('Cannot switch camera: engine not ready or not host', { hasEngine: !!engineRef.current, isHost });
      return;
    }

    if (!state.isVideoEnabled) {
      console.log('Cannot switch camera: video not enabled');
      return;
    }

    try {
      console.log('Switching camera...');
      await engineRef.current.switchCamera();
      console.log('Camera switched successfully');
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  };

  // Get remote video view component (React Native uses View component)
  const renderRemoteVideo = (uid: number) => {
    if (!engineRef.current) return null;
    // react-native-agora uses RtcSurfaceView or RtcTextureView for rendering
    return uid;
  };

  // Render local video view
  const renderLocalVideo = () => {
    if (!engineRef.current || !state.isVideoEnabled) return null;
    return 'local';
  };

  return {
    ...state,
    engine: engineRef.current,
    startVideo,
    stopVideo,
    startAudio,
    stopAudio,
    switchCamera,
    renderRemoteVideo,
    renderLocalVideo,
  };
};
