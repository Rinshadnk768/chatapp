// src/utils/media.js

import { Audio } from 'expo-av';
import { Alert } from 'react-native';

let recording = null;

export const startRecording = async () => {
  try {
    // Request permissions (Microphone permission required in app.json/native config)
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    
    recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    return true; // Success
    
  } catch (err) {
    console.error('Failed to start recording', err);
    Alert.alert('Recording Error', 'Failed to start recording.');
    recording = null;
    return false;
  }
};

export const stopRecording = async () => {
  if (!recording) return null;

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;
    return uri; // Local URI of the recorded audio file
    
  } catch (err) {
    console.error('Failed to stop recording', err);
    recording = null;
    return null;
  }
};