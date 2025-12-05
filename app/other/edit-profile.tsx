import { storageService } from '@/api/services';
import { InputComponent } from '@/components/common/input';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile as updateProfileAction } from '@/store/slices/authSlice';
import { styles } from '@/styles';
import { logger } from '@/utils/logger';
import { showToast } from '@/utils/toast';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // Form state
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null); // Local URI of new photo

  const handleChangePhoto = () => {
    setShowPhotoOptions(true);
  };

  const handleTakePhoto = async () => {
    try {
      setShowPhotoOptions(false);

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('We need permission to access your camera.', 'danger');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];

        // Check file size (2MB = 2097152 bytes)
        if (image.fileSize && image.fileSize > 2097152) {
          showToast('Please select an image smaller than 2MB.', 'danger');
          return;
        }

        // Store the new photo URI - will be uploaded when saving
        setNewAvatarUri(image.uri);
        showToast('Photo will be uploaded when you save changes.', 'success');
      }
    } catch (error) {
      showToast('Failed to take photo.', 'danger');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      setShowPhotoOptions(false);

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('We need permission to access your photos.', 'danger');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];

        // Check file size (2MB = 2097152 bytes)
        if (image.fileSize && image.fileSize > 2097152) {
          showToast('Please select an image smaller than 2MB.', 'danger');
          return;
        }

        // Store the new photo URI - will be uploaded when saving
        setNewAvatarUri(image.uri);
        showToast('Photo will be uploaded when you save changes.', 'success');
      }
    } catch (error) {
      showToast('Failed to select photo.', 'danger');
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      // Validate inputs
      if (!fullName.trim()) {
        showToast('Full name is required.', 'danger');
        setLoading(false);
        return;
      }

      if (!username.trim()) {
        showToast('Username is required.', 'danger');
        setLoading(false);
        return;
      }

      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if one was selected
      if (newAvatarUri && user?.id) {
        const uploadResult = await storageService.uploadAvatar(newAvatarUri, user.id);

        if (uploadResult.success && uploadResult.url) {
          finalAvatarUrl = uploadResult.url;
          showToast('Avatar uploaded successfully!', 'success');
        } else {
          logger.error('Avatar upload failed:', uploadResult.error);
          Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload avatar. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Update profile with all data including new avatar URL
      const result = await updateProfile({
        username: username.trim(),
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
      });

      if (result && updateProfileAction.fulfilled.match(result)) {
        showToast('Your profile has been updated successfully.', 'success');
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 500);
      } else if (result && updateProfileAction.rejected.match(result)) {
        // Show specific error if available
        const errorMessage = result.error?.message || 'Failed to update profile.';
        logger.error('Profile update error:', errorMessage);
        logger.error('Full error:', result.error);
        Alert.alert('Update Failed', errorMessage);
        showToast(errorMessage, 'danger');
      } else {
        logger.error('Unexpected result:', result);
        logger.error('Result details:', JSON.stringify(result));
        Alert.alert('Update Failed', 'An unexpected error occurred. Check console for details.');
        showToast('Failed to update profile.', 'danger');
      }
    } catch (error) {
      logger.error('Profile update exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile.';
      Alert.alert('Error', errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarSource = () => {
    // Show new avatar if selected
    if (newAvatarUri) {
      return { uri: newAvatarUri };
    }
    // Show existing avatar
    if (avatarUrl) {
      return { uri: avatarUrl };
    }
    // Show placeholder
    return {
      uri: `https://ui-avatars.com/api/?name=${user?.full_name || 'User'}&length=1&size=200`,
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center gap-4 p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <Text className="flex-1 text-lg font-inter-bold text-black">Edit Profile</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-4 p-4">
            {/* Profile Picture Section */}
            <View className="gap-4 p-4 rounded-lg bg-white shadow-lg">
              <Text className="text-base font-inter-semibold text-black">Profile Picture</Text>

              <View className="flex-row items-center">
                <View className="items-center justify-center w-24 h-24 mr-4 overflow-hidden rounded-full bg-gray-200">
                  {imageLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Image source={getAvatarSource()} style={{ width: '100%', height: '100%' }} />
                  )}
                </View>

                <View className="flex-1">
                  <TouchableOpacity
                    onPress={handleChangePhoto}
                    disabled={imageLoading}
                    className="flex-row items-center self-start px-4 py-2 rounded-lg bg-gray-100 border border-gray-200"
                  >
                    <Feather name="camera" size={16} color="#000" />
                    <Text className="ml-2 text-sm font-inter-semibold text-black">Change Photo</Text>
                  </TouchableOpacity>
                  <Text className="mt-3 text-xs font-inter text-gray-500">JPG, GIF or PNG. Max size of 2MB</Text>
                </View>
              </View>
            </View>

            {/* Personal Information Section */}
            <View className="gap-4 p-4 rounded-lg bg-white shadow-lg">
              <Text className="text-base font-inter-semibold text-black">Personal Information</Text>

              {/* Username */}
              <InputComponent
                value={username}
                label="Username"
                size="small"
                required={true}
                placeholder="Enter username"
                onChangeText={(text) => setUsername(text)}
              />

              {/* Full Name */}
              <InputComponent
                value={fullName}
                label="Full Name"
                size="small"
                required={true}
                placeholder="Enter full name"
                onChangeText={(text) => setFullName(text)}
              />

              {/* Email (Read-only) */}
              <InputComponent
                value={user?.email || ''}
                label="Email"
                size="small"
                placeholder="Enter email"
                editable={false}
              />

              {/* Bio */}
              <InputComponent
                value={bio}
                label="Bio"
                size="small"
                placeholder="Tell us about yourself..."
                onChangeText={(text) => setBio(text)}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                height={100}
              />

              {/* Save Button */}
              <Pressable
                onPress={handleSaveChanges}
                disabled={loading}
                className={`flex-row items-center justify-center px-6 py-4 bg-black rounded-lg ${
                  loading ? 'opacity-50' : ''
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View className="flex-row items-center justify-center gap-2">
                    <Feather name="save" size={18} color="#fff" />
                    <Text className="text-base font-inter-semibold text-white">Save Changes</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <SafeAreaView edges={['bottom']} className="max-h-[80%] w-full rounded-t-2xl bg-white">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-inter-bold text-black">Change Photo</Text>
              <TouchableOpacity onPress={() => setShowPhotoOptions(false)} hitSlop={8}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View className="gap-4 p-4">
              {/* Choose from Library Button */}
              <Pressable
                onPress={handleChooseFromLibrary}
                className="flex-row items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
              >
                <View className="w-12 h-12 items-center justify-center bg-green-100 rounded-full">
                  <Feather name="image" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Choose from Library</Text>
                  <Text className="text-sm font-inter text-gray-600">Select a photo from your gallery</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </Pressable>

              {/* Take Photo Button */}
              <Pressable
                onPress={handleTakePhoto}
                className="flex-row items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
              >
                <View className="w-12 h-12 items-center justify-center bg-blue-100 rounded-full">
                  <Feather name="camera" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-inter-semibold text-black">Take Photo</Text>
                  <Text className="text-sm font-inter text-gray-600">Use your camera to take a new photo</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
