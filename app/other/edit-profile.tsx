import { storageService } from '@/api';
import { useAuth } from '@/hooks/use-auth';
import { updateProfile as updateProfileAction } from '@/store/slices/authSlice';
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
  TextInput,
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
          console.error('Avatar upload failed:', uploadResult.error);
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
        console.error('Profile update error:', errorMessage);
        console.error('Full error:', result.error);
        Alert.alert('Update Failed', errorMessage);
        showToast(errorMessage, 'danger');
      } else {
        console.error('Unexpected result:', result);
        console.error('Result details:', JSON.stringify(result));
        Alert.alert('Update Failed', 'An unexpected error occurred. Check console for details.');
        showToast('Failed to update profile.', 'danger');
      }
    } catch (error) {
      console.error('Profile update exception:', error);
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
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center p-4 bg-black border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="flex-1 ml-4 text-lg font-inter-bold text-white">Edit Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          className="flex-1"
        >
          <View className="flex-1 gap-4 p-4 bg-gray-50">
            {/* Profile Picture Section */}
            <View className="p-4 rounded-lg bg-white">
              <Text className="mb-4 text-base font-inter-semibold text-black">Profile Picture</Text>

              <View className="flex-row items-center">
                <View className="relative">
                  <View className="items-center justify-center w-24 h-24 mr-4 overflow-hidden rounded-full bg-gray-200">
                    {imageLoading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Image source={getAvatarSource()} style={{ width: '100%', height: '100%' }} />
                    )}
                  </View>
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
                  <Text className="mt-3 text-xs font-inter-regular text-gray-500">
                    JPG, GIF or PNG. Max size of 2MB
                  </Text>
                </View>
              </View>
            </View>

            {/* Personal Information Section */}
            <View className="p-4 rounded-lg bg-white">
              <Text className="mb-4 text-base font-inter-semibold text-black">Personal Information</Text>

              {/* Username */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-inter-semibold text-black">Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter-regular text-black bg-gray-50 border border-gray-200 rounded-lg"
                />
              </View>

              {/* Full Name */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-inter-semibold text-black">Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter-regular text-black bg-gray-50 border border-gray-200 rounded-lg"
                />
              </View>

              {/* Email (Read-only) */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-inter-semibold text-black">Email</Text>
                <TextInput
                  value={user?.email}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  className="px-4 py-3 text-base font-inter-regular text-gray-500 bg-gray-100 border border-gray-200 rounded-lg"
                />
                <Text className="mt-1 text-xs font-inter-regular text-gray-500">
                  Email cannot be changed. Contact support if you need to update your email.
                </Text>
              </View>

              {/* Bio */}
              <View className="mb-4">
                <Text className="mb-2 text-sm font-inter-semibold text-black">Bio</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="px-4 py-3 text-base font-inter-regular text-black bg-gray-50 border border-gray-200 rounded-lg"
                  style={{ minHeight: 100 }}
                />
              </View>

              {/* Save Button */}
              <Pressable
                onPress={handleSaveChanges}
                disabled={loading}
                className={`flex-row items-center justify-center px-6 py-4 mt-4 bg-black rounded-lg ${
                  loading ? 'opacity-50' : ''
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="save" size={18} color="#fff" />
                    <Text className="ml-2 text-base font-inter-semibold text-white">Save Changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-inter-bold text-black mb-6 text-center">Change Photo</Text>

            {/* Take Photo Button */}
            <Pressable
              onPress={handleTakePhoto}
              className="flex-row items-center px-6 py-4 mb-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              <View className="w-12 h-12 items-center justify-center bg-blue-100 rounded-full">
                <Feather name="camera" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-base font-inter-semibold text-black">Take Photo</Text>
                <Text className="text-sm font-inter-regular text-gray-600">Use your camera to take a new photo</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>

            {/* Choose from Library Button */}
            <Pressable
              onPress={handleChooseFromLibrary}
              className="flex-row items-center px-6 py-4 mb-3 bg-gray-50 rounded-xl border border-gray-200"
            >
              <View className="w-12 h-12 items-center justify-center bg-green-100 rounded-full">
                <Feather name="image" size={24} color="#10B981" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-base font-inter-semibold text-black">Choose from Library</Text>
                <Text className="text-sm font-inter-regular text-gray-600">Select a photo from your gallery</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>

            {/* Cancel Button */}
            <Pressable onPress={() => setShowPhotoOptions(false)} className="px-6 py-4 mt-2 bg-gray-100 rounded-xl">
              <Text className="text-base font-inter-semibold text-black text-center">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
