import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabaseClient';
import Constants from 'expo-constants';

interface ProfileScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  viewUserId?: string | null; // If provided, view this user's profile instead of current user's
}

interface User {
  id: string;
  user_name: string | null;
  email: string;
  bio: string | null;
  rating: number | null;
  profile_picture_url: string | null;
  trade_preferences?: string[] | null;
  category_preferences?: string[] | null;
  interests?: string[] | null;
}

interface Trade {
  id: string;
  title: string;
  description: string;
  price: number | null;
  trade_options: string;
  category: string | null;
  image_urls: string[] | null;
}

export default function ProfileScreen({ onBack, onLogout, viewUserId }: ProfileScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Trade[]>([]);
  const [tradePreferences, setTradePreferences] = useState<string[]>([]);
  const [categoryPreferences, setCategoryPreferences] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [displayNameOverride, setDisplayNameOverride] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileImageSavedUri, setProfileImageSavedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingBio, setEditingBio] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

  useEffect(() => {
    fetchUserData();
  }, [viewUserId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // If viewing another user's profile, use viewUserId; otherwise get current user
      let targetUserId: string;
      let isViewingOtherUser = false;
      
      if (viewUserId) {
        targetUserId = viewUserId;
        isViewingOtherUser = true;
      } else {
        // Get current user from Supabase auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          console.error('Failed to get current user:', authError);
          setLoading(false);
          return;
        }
        
        targetUserId = authUser.id;
        setEmailAddress(authUser.email || '');
      }

      let metadataDisplayName = '';
      let metadataBio = '';
      let metadataProfileUrl = null;
      let metadataTradePrefs: string[] = [];
      let metadataCategoryPrefs: string[] = [];
      let metadataInterests: string[] = [];

      // Only get metadata if viewing own profile
      if (!isViewingOtherUser) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const metadata = authUser.user_metadata ?? {};
          metadataDisplayName =
            typeof metadata.display_name === 'string' ? metadata.display_name.trim() : '';
          metadataBio =
            typeof metadata.bio === 'string' ? metadata.bio : '';
          metadataProfileUrl =
            typeof metadata.profile_picture_url === 'string' && metadata.profile_picture_url.length > 0
              ? metadata.profile_picture_url
              : null;
          metadataTradePrefs = Array.isArray(metadata.trade_preferences)
            ? metadata.trade_preferences.map((item: any) => String(item))
            : typeof metadata.trade_preferences === 'string'
              ? metadata.trade_preferences.split(',').map(item => item.trim()).filter(Boolean)
              : [];
          metadataCategoryPrefs = Array.isArray(metadata.category_preferences)
            ? metadata.category_preferences.map((item: any) => String(item))
            : typeof metadata.category_preferences === 'string'
              ? metadata.category_preferences.split(',').map(item => item.trim()).filter(Boolean)
              : [];
          metadataInterests = Array.isArray(metadata.interests)
            ? metadata.interests.map((item: any) => String(item))
            : typeof metadata.interests === 'string'
              ? metadata.interests.split(',').map(item => item.trim()).filter(Boolean)
              : [];
        }
      }

      let dbTradePrefs: string[] = [];
      let dbCategoryPrefs: string[] = [];
      let dbInterests: string[] = [];

      let resolvedName = metadataDisplayName;
      let resolvedBio = metadataBio;
      let resolvedProfileUrl = metadataProfileUrl;

      // Fetch user profile from API
      const userResponse = await fetch(`${apiUrl}/api/users/${targetUserId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.user) {
          setUser(userData.user);
          resolvedName = resolvedName || userData.user.user_name || '';
          resolvedBio = resolvedBio || userData.user.bio || '';
          resolvedProfileUrl = resolvedProfileUrl || userData.user.profile_picture_url || null;
          if (Array.isArray(userData.user.trade_preferences)) {
            dbTradePrefs = userData.user.trade_preferences.map((item: any) => String(item));
          }
          if (Array.isArray(userData.user.category_preferences)) {
            dbCategoryPrefs = userData.user.category_preferences.map((item: any) => String(item));
          }
          if (Array.isArray(userData.user.interests)) {
            dbInterests = userData.user.interests.map((item: any) => String(item));
          }
        }
      } else if (userResponse.status === 404) {
        // User doesn't exist in users table
        if (isViewingOtherUser) {
          // Can't create profile for other users
          console.error('User profile not found');
          setLoading(false);
          return;
        }
        // Create one for current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const createResponse = await fetch(`${apiUrl}/api/users`, {
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
        
        if (createResponse.ok) {
          const createData = await createResponse.json();
          if (createData.user) {
            setUser(createData.user);
            resolvedName = resolvedName || createData.user.user_name || '';
            resolvedBio = resolvedBio || createData.user.bio || '';
            resolvedProfileUrl = resolvedProfileUrl || createData.user.profile_picture_url || null;
            if (Array.isArray(createData.user.trade_preferences)) {
              dbTradePrefs = createData.user.trade_preferences.map((item: any) => String(item));
            }
            if (Array.isArray(createData.user.category_preferences)) {
              dbCategoryPrefs = createData.user.category_preferences.map((item: any) => String(item));
            }
            if (Array.isArray(createData.user.interests)) {
              dbInterests = createData.user.interests.map((item: any) => String(item));
            }
          }
        } else {
          // Fallback to auth user data if creation fails
          const fallbackUser = {
            id: authUser.id,
            email: authUser.email || '',
            user_name: authUser.user_metadata?.user_name || null,
            bio: null,
            rating: null,
            profile_picture_url: null,
            trade_preferences: null,
            category_preferences: null,
            interests: null,
          };
          setUser(fallbackUser);
          resolvedName = resolvedName || fallbackUser.user_name || '';
          resolvedBio = resolvedBio || fallbackUser.bio || '';
          resolvedProfileUrl = resolvedProfileUrl || fallbackUser.profile_picture_url || null;
        }
        }
      }

      // Fetch user's listings
      const listingsResponse = await fetch(`${apiUrl}/api/trades?offerer_user_id=${targetUserId}&limit=20&accepted=false`);
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        if (listingsData.trades) {
          setUserListings(listingsData.trades);
        }
      } else {
        console.error('Failed to fetch listings:', listingsResponse.status, listingsResponse.statusText);
      }

      const combinedTradePrefs = metadataTradePrefs.length > 0 ? metadataTradePrefs : dbTradePrefs;
      const combinedCategoryPrefs = metadataCategoryPrefs.length > 0 ? metadataCategoryPrefs : dbCategoryPrefs;
      const combinedInterests = metadataInterests.length > 0 ? metadataInterests : dbInterests;

      setTradePreferences(combinedTradePrefs);
      setCategoryPreferences(combinedCategoryPrefs);
      setInterests(combinedInterests);

      const normalizedName = resolvedName || '';
      const normalizedBio = resolvedBio || '';
      const normalizedProfileUri = resolvedProfileUrl || null;

      setProfileBio(normalizedBio);
      setEditingName(normalizedName);
      setEditingBio(normalizedBio);
      setProfileImageUri(normalizedProfileUri);
      setProfileImageSavedUri(normalizedProfileUri);
      if (!isViewingOtherUser) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setDisplayNameOverride(
            normalizedName ||
              (authUser.email ? authUser.email.split('@')[0].replace(/\./g, ' ') : '')
          );
        }
      } else {
        setDisplayNameOverride(normalizedName);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (trade: Trade) => {
    if (trade.trade_options === 'Sell' && trade.price !== null) {
      return `$${trade.price.toFixed(2)}`;
    } else if (trade.trade_options === 'Trade') {
      return 'Trade';
    } else if (trade.trade_options === 'Looking for') {
      return 'Looking for';
    }
    return '';
  };

  const getUsername = () => {
    if (displayNameOverride) return displayNameOverride;
    if (user?.user_name) return user.user_name;
    if (user?.email) {
      const emailPart = user.email.split('@')[0];
      // Remove dots and format nicely
      return emailPart.replace(/\./g, '');
    }
    return 'User';
  };

  const getDisplayName = () => {
    if (displayNameOverride) return displayNameOverride;
    if (user?.user_name) return user.user_name;
    if (user?.email) {
      const emailPart = user.email.split('@')[0];
      // Capitalize first letter of each word
      return emailPart.split('.').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') || emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
    }
    return 'User';
  };

  const normalizeList = (items: string[]) => {
    const seen = new Set<string>();
    const result: string[] = [];

    items.forEach((raw) => {
      if (typeof raw !== 'string') return;
      const trimmed = raw.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const formatted = trimmed
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : ''))
        .join(' ');
      result.push(formatted);
    });

    return result;
  };

  const renderChipGroup = (items: string[], emptyLabel: string) => {
    if (!items || items.length === 0) {
      return <Text style={styles.emptyText}>{emptyLabel}</Text>;
    }

    return (
      <View style={styles.tagsContainer}>
        {items.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.tag}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const normalizedTradePreferences = normalizeList(tradePreferences);
  const normalizedInterests = normalizeList(interests);
  const normalizedFocusCategories = normalizeList(categoryPreferences);
  const quickTradePreview = normalizedTradePreferences.slice(0, 3);
  const emailToShow = emailAddress || user?.email || '';
  const displayNameLabel = getDisplayName();
  const profileInitial = displayNameLabel.trim().charAt(0).toUpperCase() || 'B';

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('Failed to sign out:', error);
          } finally {
            if (onLogout) onLogout();
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditingName(displayNameLabel);
    setEditingBio(profileBio);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingName(displayNameLabel);
    setEditingBio(profileBio);
    setProfileImageUri(profileImageSavedUri);
  };

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfileImage = async (imageUri: string, userId: string): Promise<string | null> => {
    try {
      // Read file as base64
      const base64String = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64String || base64String.length === 0) {
        throw new Error('Failed to read image file');
      }

      // Determine MIME type
      let mimeType = 'image/jpeg';
      const uriParts = imageUri.split('.');
      if (uriParts.length > 1) {
        const ext = uriParts[uriParts.length - 1].toLowerCase().split('?')[0];
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'webp') mimeType = 'image/webp';
      }

      // Format as data URL
      const dataUrl = `data:${mimeType};base64,${base64String}`;

      // Upload via API
      const response = await fetch(`${apiUrl}/api/upload/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [dataUrl],
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.urls && data.urls.length > 0 ? data.urls[0] : null;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user || viewUserId) return; // Don't allow saving when viewing another user's profile

    try {
      setSaving(true);

      // Get current user from Supabase auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        Alert.alert('Error', 'Failed to get current user');
        setSaving(false);
        return;
      }

      let profilePictureUrl = profileImageUri;

      // Upload new profile image if a local URI is set (not already a URL)
      if (profileImageUri && !profileImageUri.startsWith('http')) {
        try {
          const uploadedUrl = await uploadProfileImage(profileImageUri, authUser.id);
          if (uploadedUrl) {
            profilePictureUrl = uploadedUrl;
          } else {
            Alert.alert('Warning', 'Failed to upload profile picture. Continue without updating it?', [
              { text: 'Cancel', onPress: () => { setSaving(false); return; } },
              { text: 'Continue', onPress: () => {} }
            ]);
            if (!uploadedUrl) {
              profilePictureUrl = user.profile_picture_url; // Keep existing
            }
          }
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to upload profile picture');
          setSaving(false);
          return;
        }
      }

      await supabase.auth.updateUser({
        data: {
          display_name: editingName.trim(),
          bio: editingBio.trim(),
          profile_picture_url: profilePictureUrl || '',
        },
      });

      // Update user profile
      const updateData: Record<string, string> = {};
      if (editingName.trim() !== (user.user_name || '')) {
        updateData.user_name = editingName.trim();
      }
      if (editingBio.trim() !== (user.bio || '')) {
        updateData.bio = editingBio.trim();
      }
      if (profilePictureUrl !== user.profile_picture_url) {
        updateData.profile_picture_url = profilePictureUrl || '';
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        setSaving(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/users/${authUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        Alert.alert('Error', errorData.error || 'Failed to update profile');
        setSaving(false);
        return;
      }

      const responseData = await response.json();
      if (responseData.user) {
        setUser(responseData.user);
        setDisplayNameOverride(editingName.trim());
        setProfileBio(editingBio.trim());
        setProfileImageUri(profilePictureUrl || null);
        setProfileImageSavedUri(profilePictureUrl || null);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#9ca3af"
              editable={false}
            />
          </View>
          <View style={styles.usernameTag}>
            <Text style={styles.usernameText}>{getUsername()}</Text>
          </View>
          {!viewUserId && (
            !isEditing ? (
              <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Ionicons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            )
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <>
        {/* Profile Information */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
                <TouchableOpacity
                  onPress={!viewUserId && isEditing ? pickProfileImage : undefined}
                  disabled={!isEditing}
                  style={styles.profileImageTouchable}
                >
            <View style={styles.profileImage}>
                    {profileImageUri ? (
                      <Image
                        source={{ uri: profileImageUri }}
                        style={styles.profileImagePhoto}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Text style={styles.profileImageInitial}>
                          {profileInitial}
                        </Text>
                      </View>
                    )}
                    {isEditing && (
                      <View style={styles.profileImageOverlay}>
                        <Ionicons name="camera" size={24} color="#ffffff" />
                      </View>
                    )}
            </View>
                </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
                  {isEditing ? (
                    <TextInput
                      style={styles.nameInput}
                      value={editingName}
                      onChangeText={setEditingName}
                      placeholder="Enter your name"
                      placeholderTextColor="#9ca3af"
                    />
                  ) : (
                    <Text style={styles.profileName}>{displayNameLabel}</Text>
                  )}
                  {!isEditing && (
                <TouchableOpacity style={styles.messageButton}>
                  <Ionicons name="mail-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
                  )}
            </View>

            {!!emailToShow && (
              <Text style={styles.profileEmail}>{emailToShow}</Text>
            )}

            {!isEditing && quickTradePreview.length > 0 && (
              <View style={styles.quickTagsRow}>
                {quickTradePreview.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.quickTag}>
                    <Text style={styles.quickTagText}>{item}</Text>
                  </View>
                ))}
                {normalizedTradePreferences.length > quickTradePreview.length && (
                  <View style={styles.quickTag}>
                    <Text style={styles.quickTagText}>
                      +{normalizedTradePreferences.length - quickTradePreview.length}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!isEditing && (
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, i) => {
                  const rating = user?.rating || 0;
                  const filled = i < Math.floor(rating);
                  return (
                    <View key={i} style={i > 0 ? styles.ratingStarSpacing : undefined}>
                      <Ionicons
                        name="star"
                        size={20}
                        color={filled ? "#3b82f6" : "#e5e7eb"}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {isEditing ? (
            <TextInput
              style={styles.bioInput}
              value={editingBio}
              onChangeText={setEditingBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.bioText}>
              {profileBio ? profileBio : 'No bio yet'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          {renderChipGroup(
            normalizedInterests,
            'Add a few interests to help Bruins get to know you.'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trade Preferences</Text>
          {renderChipGroup(
            normalizedTradePreferences,
            'Choose if you are here to buy, sell, or trade.'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Categories</Text>
          {renderChipGroup(
            normalizedFocusCategories,
            'Pick categories you want to see more of.'
          )}
        </View>

        {/* Listings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listings</Text>
          {userListings.length > 0 ? (
            <View style={styles.listingsGrid}>
              {userListings.map((listing) => (
                <View key={listing.id} style={styles.listingCard}>
                  <View style={styles.listingImage} />
                  <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                  <View style={styles.listingStatusContainer}>
                    <View style={styles.listingStatusDot} />
                    <Text style={styles.listingStatusText}>{formatPrice(listing)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No listings yet</Text>
          )}
        </View>
          </>
        )}
        {!viewUserId && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  usernameTag: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 4,
    paddingHorizontal: 8,
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImageTouchable: {
    width: 110,
    height: 110,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    backgroundColor: '#e2e8f0',
    borderWidth: 3,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImagePhoto: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  profileImageInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  profileImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  nameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#3b82f6',
    paddingBottom: 4,
  },
  messageButton: {
    padding: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  ratingStarSpacing: {
    marginLeft: 2,
  },
  quickTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  quickTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  quickTagText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 22,
  },
  bioInput: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  tag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 6,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listingCard: {
    width: '47%',
    marginBottom: 16,
  },
  listingImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  listingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginRight: 6,
  },
  listingStatusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutContainer: {
    alignItems: 'stretch',
    marginTop: 24,
    marginBottom: 40,
    marginHorizontal: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

