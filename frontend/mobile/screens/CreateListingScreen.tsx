import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { CATEGORIES } from '../constants/data';
import PreviewListingScreen, { ListingData } from './PreviewListingScreen';
import { supabase } from '../lib/supabaseClient';
import Constants from 'expo-constants';

interface CreateListingScreenProps {
  onClose: () => void;
}

export default function CreateListingScreen({ onClose }: CreateListingScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('Events');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

  const handlePreview = () => {
    setShowPreview(true);
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload photos!');
      return;
    }

    // Launch image picker with compression to reduce payload size
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.6, // Reduced quality to decrease file size
      allowsEditing: false,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages([...selectedImages, ...newImages].slice(0, 10)); // Limit to 10 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const uploadImagesToSupabase = async (imageUris: string[], userId: string): Promise<string[]> => {
    try {
      // Read all images as base64
      const base64Images: string[] = [];
      
      for (const uri of imageUris) {
        try {
          // Read file as base64 (will throw error if file doesn't exist)
          let base64String: string;
          try {
            base64String = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readError: any) {
            console.error('Error reading file:', readError);
            continue;
          }
          
          if (!base64String || typeof base64String !== 'string' || base64String.length === 0) {
            console.error('Failed to read file as base64 or result is invalid');
            continue;
          }

          // Determine MIME type from file extension
          let mimeType = 'image/jpeg';
          const uriParts = uri.split('.');
          if (uriParts.length > 1) {
            const ext = uriParts[uriParts.length - 1].toLowerCase().split('?')[0];
            if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'gif') mimeType = 'image/gif';
            else if (ext === 'webp') mimeType = 'image/webp';
          }

          // Format as data URL for API
          base64Images.push(`data:${mimeType};base64,${base64String}`);
        } catch (error: any) {
          console.error('Error reading image:', error);
        }
      }

      if (base64Images.length === 0) {
        return [];
      }

      // Upload via API
      const response = await fetch(`${apiUrl}/api/upload/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images,
          userId: userId,
        }),
      });

      if (!response.ok) {
        // Try to parse as JSON, but handle HTML/plain text errors
        let errorMessage = `Failed to upload images (${response.status})`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 200));
            // If it's HTML, it's likely a 404 or 500 error page
            if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
              errorMessage = `Server error: ${response.status}. The upload endpoint may not be available.`;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON success response:', text.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();
      return data.urls || [];
    } catch (error: any) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handlePublish = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option (Sell, Trade, or Looking for)');
      return;
    }
    if (selectedOption === 'Sell' && !price.trim()) {
      Alert.alert('Error', 'Please enter a price for selling');
      return;
    }

    setIsPublishing(true);
    try {
      // Get current user from Supabase auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        Alert.alert('Error', 'Please log in to create a listing');
        setIsPublishing(false);
        return;
      }

      // Ensure user exists in users table (create if doesn't exist)
      let userCheckResponse = await fetch(`${apiUrl}/api/users/${authUser.id}`);
      if (userCheckResponse.status === 404) {
        // User doesn't exist, create them
        const createUserResponse = await fetch(`${apiUrl}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: authUser.id,
            email: authUser.email || '',
            user_name: authUser.user_metadata?.user_name || null,
          }),
        });
        
        if (!createUserResponse.ok) {
          const errorData = await createUserResponse.json();
          // If user already exists (duplicate email/id), that's okay - continue with listing creation
          if (errorData.error?.includes('already exists') || 
              errorData.error?.includes('23505') ||
              errorData.error?.includes('duplicate key')) {
            // User already exists, continue with listing creation
            console.log('User already exists, continuing with listing creation');
          } else {
            Alert.alert('Error', `Failed to create user profile: ${errorData.error || 'Unknown error'}`);
            setIsPublishing(false);
            return;
          }
        }
      } else if (!userCheckResponse.ok) {
        Alert.alert('Error', 'Failed to verify user account');
        setIsPublishing(false);
        return;
      }

      // Upload images if any are selected
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          imageUrls = await uploadImagesToSupabase(selectedImages, authUser.id);
        } catch (error) {
          console.error('Failed to upload images:', error);
          Alert.alert('Warning', 'Failed to upload some images. Continue without images?', [
            { text: 'Cancel', onPress: () => { setIsPublishing(false); setUploadingImages(false); return; } },
            { text: 'Continue', onPress: () => {} }
          ]);
        } finally {
          setUploadingImages(false);
        }
      }

      // Prepare trade data
      const tradeData: Record<string, unknown> = {
        offerer_user_id: authUser.id,
        title: title.trim(),
        description: description.trim(),
        trade_options: selectedOption,
        category: selectedCategory,
      };

      // Add images if uploaded
      if (imageUrls.length > 0) {
        tradeData.image_urls = imageUrls;
      }

      if (selectedTags.length > 0) {
        tradeData.tags = selectedTags;
      }

      // Add price if it's a Sell option
      if (selectedOption === 'Sell' && price.trim()) {
        const priceNum = parseFloat(price.trim());
        if (isNaN(priceNum) || priceNum <= 0) {
          Alert.alert('Error', 'Please enter a valid price');
          setIsPublishing(false);
          return;
        }
        tradeData.price = priceNum;
      }

      // Make API call to create trade
      const response = await fetch(`${apiUrl}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        Alert.alert('Error', responseData.error || `Failed to create listing (Status: ${response.status})`);
        setIsPublishing(false);
        return;
      }

      // Success!
      Alert.alert('Success', 'Listing created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowPreview(false);
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setPrice('');
            setSelectedOption(null);
            setSelectedCategory('Events');
            setSelectedImages([]);
            setSelectedTags([]);
            setCustomTagInput('');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      Alert.alert('Error', error.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const listingData: ListingData = {
    title: title || 'Title',
    description,
    price,
    category: selectedCategory,
    selectedOption,
    images: selectedImages,
    tags: selectedTags,
  };

  return (
    <Modal visible={true} animationType="none" presentationStyle="overFullScreen">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create a New Listing</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Add Photos Section */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionLabel}>Add Photos</Text>
              <View style={styles.photosContainer}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={[styles.photoContainer, index < selectedImages.length - 1 && { marginRight: 12 }]}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedImages.length < 10 && (
                  <TouchableOpacity 
                    style={[styles.photoPlaceholder, selectedImages.length > 0 && { marginLeft: 12 }]}
                    onPress={pickImage}
                  >
                    <Ionicons name="add" size={32} color="#9ca3af" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Basic Info Section */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Basic Info</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Placeholder"
                  placeholderTextColor="#9ca3af"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={[
                        styles.categoryPill,
                        selectedCategory === category && styles.categoryPillActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          selectedCategory === category && styles.categoryPillTextActive
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
               <Text style={styles.inputLabel}>Tags</Text>
                {/* Tag Input */}
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="e.g. furniture, bike, resume help"
                    placeholderTextColor="#9ca3af"
                    value={customTagInput}
                    onChangeText={setCustomTagInput}
                    maxLength={30}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      const trimmedTag = customTagInput.trim();
                      if (trimmedTag && !selectedTags.includes(trimmedTag)) {
                        setSelectedTags([...selectedTags, trimmedTag]);
                        setCustomTagInput('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.addTagButton,
                      !customTagInput.trim() && styles.addTagButtonDisabled
                    ]}
                    onPress={() => {
                      const trimmedTag = customTagInput.trim();
                      if (trimmedTag && !selectedTags.includes(trimmedTag)) {
                        setSelectedTags([...selectedTags, trimmedTag]);
                        setCustomTagInput('');
                      }
                    }}
                    disabled={!customTagInput.trim()}
                  >
                    <Text style={[
                      styles.addTagButtonText,
                      !customTagInput.trim() && styles.addTagButtonTextDisabled
                    ]}>
                      Add
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Selected Tags Display */}
                {selectedTags.length > 0 && (
                  <View style={styles.selectedTagsContainer}>
                    {selectedTags.map((tag, index) => (
                      <View key={index} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <TouchableOpacity
                          onPress={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                          style={styles.removeTagButton}
                        >
                          <Ionicons name="close" size={14} color="#1f2937" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Placeholder"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Pricing</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Options</Text>
                <View style={styles.optionsContainer}>
                  {['Sell', 'Trade', 'Looking for'].map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setSelectedOption(option)}
                      style={[
                        styles.optionPill,
                        index > 0 && { marginLeft: 8 },
                        selectedOption === option && styles.optionPillActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionPillText,
                          selectedOption === option && styles.optionPillTextActive
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Placeholder"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            {/* Preview Button */}
            <TouchableOpacity 
              style={[styles.previewButton, (isPublishing || uploadingImages) && styles.previewButtonDisabled]} 
              onPress={handlePreview}
              disabled={isPublishing || uploadingImages}
            >
              {uploadingImages ? (
                <ActivityIndicator color="#1f2937" />
              ) : (
                <Text style={styles.previewButtonText}>Preview</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Preview Listing Screen */}
      <PreviewListingScreen
        visible={showPreview}
        listingData={listingData}
        onClose={() => setShowPreview(false)}
        onPublish={handlePublish}
        isPublishing={isPublishing}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  keyboardView: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  previewButtonDisabled: {
    opacity: 0.6,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
  },
  pillsContainer: {
    flexDirection: 'row',
  },
  categoryPill: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#e5e7eb',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  categoryPillTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  tagInputContainer: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  addTagButton: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addTagButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  addTagButtonTextDisabled: {
    color: '#9ca3af',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  removeTagButton: {
    padding: 2,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionPill: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  optionPillActive: {
    backgroundColor: '#e5e7eb',
  },
  optionPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  optionPillTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  previewButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 30,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});

