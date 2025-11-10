import { CreateStreamData, storageService, streamsService } from '@/api';
import { DropdownComponent, InputComponent } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { styles } from '@/styles';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STREAM_CATEGORY_OPTIONS = [
  { label: 'Beauty', value: 'Beauty' },
  { label: 'Books', value: 'Books' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Fashion', value: 'Fashion' },
  { label: 'Food', value: 'Food' },
  { label: 'Home', value: 'Home' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Toys', value: 'Toys' },
  { label: 'Collectibles', value: 'Collectibles' },
  { label: 'Art', value: 'Art' },
  { label: 'Gaming', value: 'Gaming' },
  { label: 'Music', value: 'Music' },
  { label: 'Other', value: 'Other' },
];

const TIMEZONE_OPTIONS = [
  { label: 'UTC (GMT+0)', value: 'UTC' },
  { label: 'London (GMT+0/+1)', value: 'Europe/London' },
  { label: 'Paris (GMT+1/+2)', value: 'Europe/Paris' },
  { label: 'New York (GMT-5/-4)', value: 'America/New_York' },
  { label: 'Los Angeles (GMT-8/-7)', value: 'America/Los_Angeles' },
  { label: 'Tokyo (GMT+9)', value: 'Asia/Tokyo' },
  { label: 'Sydney (GMT+10/+11)', value: 'Australia/Sydney' },
];

const DURATION_OPTIONS = [
  { label: '30 minutes', value: '0.5' },
  { label: '1 hour', value: '1' },
  { label: '1.5 hours', value: '1.5' },
  { label: '2 hours', value: '2' },
  { label: '3 hours', value: '3' },
  { label: '4 hours', value: '4' },
  { label: '6 hours', value: '6' },
  { label: '8 hours', value: '8' },
];

export default function ScheduleStreamScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [thumbnail, setThumbnail] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timezone, setTimezone] = useState('Europe/London');
  const [duration, setDuration] = useState('2');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isEditMode = !!edit;

  useEffect(() => {
    if (edit) {
      loadStream();
    }
  }, [edit]);

  const loadStream = async () => {
    if (!edit) return;

    setIsLoading(true);
    try {
      const stream = await streamsService.getStream(edit);
      if (stream) {
        setTitle(stream.title);
        setDescription(stream.description);
        setCategory(stream.category);
        setStartTime(new Date(stream.start_time));
        setThumbnail(stream.thumbnail || '');
      }
    } catch (error) {
      console.error('Error loading stream:', error);
      showErrorToast('Failed to load stream');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      showErrorToast('You must be logged in to schedule a stream');
      return;
    }

    if (!title.trim()) {
      showErrorToast('Please enter a stream title');
      return;
    }

    if (!description.trim()) {
      showErrorToast('Please enter a stream description');
      return;
    }

    if (!category.trim()) {
      showErrorToast('Please select a category for your stream');
      return;
    }

    if (startTime < new Date()) {
      showErrorToast('Start time must be in the future');
      return;
    }

    setIsSaving(true);

    try {
      const streamData: CreateStreamData = {
        title: title.trim(),
        description: description.trim(),
        category,
        start_time: startTime.toISOString(),
        thumbnail: thumbnail || undefined,
      };

      if (isEditMode) {
        await streamsService.updateStream(edit!, streamData);
        showSuccessToast('Stream updated successfully');
      } else {
        await streamsService.createStream(user.id, streamData);
        showSuccessToast('Stream scheduled successfully');
      }

      router.back();
    } catch (error) {
      console.error('Error saving stream:', error);
      showErrorToast(isEditMode ? 'Failed to update stream' : 'Failed to schedule stream');
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(startTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setStartTime(newDate);
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(startTime);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setStartTime(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const pickImageFromGallery = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload thumbnail images. Please enable this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true, // Required for Supabase upload
      });

      if (!result.canceled && result.assets[0]) {
        // Validate image before processing
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'Image Too Large',
            `Image "${asset.fileName || 'Unknown'}" is too large. Please select an image smaller than 10MB.`
          );
          return;
        }

        setShowImagePickerModal(false);
        await uploadThumbnail(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showErrorToast('Failed to pick image from gallery. Please try again.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      // Request camera permissions first
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need access to your camera to take thumbnail photos. Please enable this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [16, 9],
        base64: true, // Required for Supabase upload
      });

      if (!result.canceled && result.assets[0]) {
        setShowImagePickerModal(false);
        await uploadThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showErrorToast('Failed to take photo. Please try again.');
    }
  };

  const uploadThumbnail = async (imageUri: string) => {
    if (!user?.id) {
      showErrorToast('You must be logged in to upload images');
      return;
    }

    setIsUploadingThumbnail(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const result = await storageService.uploadImage(imageUri, user.id);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        setThumbnail(result.url);
        showSuccessToast('Thumbnail uploaded successfully');
      } else {
        showErrorToast(result.error || 'Failed to upload thumbnail');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      showErrorToast('Failed to upload thumbnail. Please check your internet connection and try again.');
    } finally {
      setIsUploadingThumbnail(false);
      setUploadProgress(0);
    }
  };

  const removeThumbnail = () => {
    Alert.alert('Remove Thumbnail', 'Are you sure you want to remove this thumbnail?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setThumbnail(''),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">
            {isEditMode ? 'Edit Stream' : 'Schedule Stream'}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="mt-3 text-base font-inter-bold text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={isSaving}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 ml-4 text-lg font-inter-bold text-black">
          {isEditMode ? 'Edit Stream' : 'Schedule Stream'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-4 gap-4">
            <View className="gap-4 p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-1 flex-row items-center gap-2">
                <Feather name="camera" size={20} color="#000" />
                <Text className="text-lg font-inter-bold text-black">Stream Details</Text>
              </View>

              {/* Title */}
              <InputComponent
                value={title}
                label="Stream Title"
                size="small"
                required={true}
                placeholder="e.g., Live Fashion Show - Spring Collection"
                onChangeText={setTitle}
              />

              {/* Description */}
              <InputComponent
                value={description}
                label="Description"
                size="small"
                required={true}
                placeholder="Tell viewers what to expect from your stream..."
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                height={100}
                maxLength={500}
              />

              {/* Category */}
              <DropdownComponent
                data={STREAM_CATEGORY_OPTIONS}
                value={category}
                label="Category"
                required={true}
                placeholder="Select a category for your stream"
                onChange={(item) => setCategory(item.value)}
                size="small"
              />

              {/* Stream Status & Time Until Start */}
              {edit && (
                <View className="flex-row items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <View className="flex-row items-center gap-3">
                    <View className="bg-blue-600 rounded-full px-3 py-1">
                      <Text className="text-xs font-inter-bold text-white uppercase">SCHEDULED</Text>
                    </View>
                    {category && <Text className="text-sm font-inter-semibold text-gray-700">{category}</Text>}
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Feather name="clock" size={16} color="#8B5CF6" />
                    <Text className="text-sm font-inter-semibold text-purple-600">
                      {(() => {
                        const now = new Date();
                        const diffMs = now.getTime() - startTime.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                        if (diffMs < 0) {
                          return 'Started';
                        } else if (diffHours < 1) {
                          return `${diffMinutes}m`;
                        } else if (diffHours < 24) {
                          return `${diffHours}h`;
                        } else {
                          const diffDays = Math.floor(diffHours / 24);
                          return `${diffDays}d`;
                        }
                      })()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Thumbnail */}
              <View className="flex-1 gap-2">
                <Text className="text-sm font-inter-semibold text-gray-700">Thumbnail (Optional)</Text>
                <Text className="text-xs font-inter text-gray-500 mb-2">
                  Recommended: 16:9 aspect ratio (e.g., 1920x1080)
                </Text>

                {thumbnail ? (
                  <View className="relative">
                    <Image source={{ uri: thumbnail }} className="w-full h-48 rounded-lg" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={removeThumbnail}
                      className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                      disabled={isUploadingThumbnail}
                    >
                      <Feather name="trash-2" size={16} color="#fff" />
                    </TouchableOpacity>
                    {/* Upload Progress Overlay */}
                    {isUploadingThumbnail && (
                      <View className="absolute inset-0 bg-black/20 rounded-lg items-center justify-center">
                        <View className="bg-white rounded-lg p-4 items-center">
                          <ActivityIndicator size="large" color="#10b981" />
                          <Text className="mt-2 text-sm font-inter-semibold text-gray-600">Uploading...</Text>
                          <Text className="mt-1 text-xs font-inter-semibold text-gray-500">
                            {uploadProgress}% complete
                          </Text>
                          <View className="mt-2 w-32 h-1 bg-gray-200 rounded-full">
                            <View className="h-1 bg-green-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowImagePickerModal(true)}
                    disabled={isUploadingThumbnail}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center justify-center"
                    style={{ minHeight: 150 }}
                  >
                    {isUploadingThumbnail ? (
                      <>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text className="mt-2 text-sm font-inter-semibold text-gray-600">Uploading...</Text>
                        <Text className="mt-1 text-xs font-inter-semibold text-gray-500">
                          {uploadProgress}% complete
                        </Text>
                        <View className="mt-3 w-32 h-1 bg-gray-200 rounded-full">
                          <View className="h-1 bg-green-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
                        </View>
                      </>
                    ) : (
                      <>
                        <Feather name="upload" size={40} color="#9CA3AF" />
                        <Text className="mt-3 text-base font-inter-semibold text-gray-700">Upload Thumbnail</Text>
                        <Text className="mt-1 text-xs font-inter text-gray-500">
                          Tap to choose from gallery or camera
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View className="gap-4 p-4 rounded-lg bg-white shadow-lg">
              <View className="flex-1 flex-row items-center gap-2">
                <Feather name="calendar" size={20} color="#000" />
                <Text className="text-lg font-inter-bold text-black">Schedule Show</Text>
              </View>

              <View className="flex-1 gap-2">
                <Text className="text-sm font-inter-semibold text-gray-700">Start Date *</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Feather name="calendar" size={20} color="#000" />
                    <Text className="text-black font-inter ml-3">{formatDate(startTime)}</Text>
                  </View>
                  <Feather name="chevron-down" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Time */}
              <View className="flex-1 gap-2">
                <Text className="text-sm font-inter-semibold text-gray-700">Start Time *</Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="bg-white border border-gray-300 px-4 py-3 rounded-lg flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Feather name="clock" size={20} color="#000" />
                    <Text className="text-black font-inter ml-3">{formatTime(startTime)}</Text>
                  </View>
                  <Feather name="chevron-down" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Timezone */}
              <View className="gap-2">
                <Text className="text-sm font-inter-semibold text-gray-700">Timezone</Text>
                <DropdownComponent
                  data={TIMEZONE_OPTIONS}
                  value={timezone}
                  placeholder="Select timezone"
                  onChange={(item) => setTimezone(item.value)}
                />
              </View>

              {/* Duration */}
              <View className="gap-2">
                <Text className="text-sm font-inter-semibold text-gray-700">Duration</Text>
                <DropdownComponent
                  data={DURATION_OPTIONS}
                  value={duration}
                  placeholder="Select duration"
                  onChange={(item) => setDuration(item.value)}
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className={`flex-1 rounded-lg py-3 flex-row items-center justify-center ${
                  isSaving ? 'bg-gray-300' : 'bg-black'
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-base font-inter-bold text-white text-center">Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isSaving}
                className="flex-1 bg-gray-200 rounded-lg py-3 flex-row items-center justify-center"
              >
                <Text className="text-base font-inter-bold text-gray-900 text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={startTime}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && <DateTimePicker value={startTime} mode="time" display="default" onChange={onTimeChange} />}

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="rounded-t-2xl bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-inter-bold text-black">Add Stream Thumbnail</Text>
              <TouchableOpacity
                onPress={() => setShowImagePickerModal(false)}
                className="items-center justify-center w-6 h-6"
              >
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <View className="gap-4 p-4">
              {/* Info */}
              <View className="p-4 rounded-lg bg-blue-50">
                <View className="flex-row items-center">
                  <Feather name="info" size={16} color="#3B82F6" />
                  <Text className="ml-2 text-sm font-inter-semibold text-blue-800">Recommended: 16:9 aspect ratio</Text>
                </View>
                <Text className="mt-1 text-xs font-inter-semibold text-blue-600">
                  Choose a high-quality image that represents your stream content
                </Text>
              </View>

              {/* Options */}
              <TouchableOpacity
                className="flex-row items-center gap-1 py-4 px-4 rounded-lg bg-gray-100"
                onPress={pickImageFromGallery}
              >
                <Feather name="image" size={24} color="#666" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Choose from Gallery</Text>
                  <Text className="text-sm font-inter-semibold text-gray-600">
                    Select an image from your photo library
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center gap-1 py-4 px-4 rounded-lg bg-gray-100"
                onPress={takePhotoWithCamera}
              >
                <Feather name="camera" size={24} color="#666" />
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Take Photo</Text>
                  <Text className="text-sm font-inter-semibold text-gray-600">
                    Capture a new photo with your camera
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
