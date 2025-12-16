import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabaseClient';
import ScreenHeader from '../components/ScreenHeader';

interface Trade {
  id: string;
  title: string;
  description: string;
  price: number | null;
  trade_options: string;
  category: string | null;
  image_urls: string[] | null;
  tags: string[] | null;
  offerer_user_id: string;
}

interface SellerProfile {
  id: string;
  user_name: string | null;
  email: string;
  bio: string | null;
  rating: number | null;
  profile_picture_url: string | null;
  trade_preferences: string[] | null;
  category_preferences: string[] | null;
  interests: string[] | null;
}

interface ListingDetailScreenProps {
  visible: boolean;
  tradeId: string | null;
  onClose: () => void;
  navigation: any;
}

export default function ListingDetailScreen({
  visible,
  tradeId,
  onClose,
  navigation
}: ListingDetailScreenProps) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState<Array<{id: string, rating: number, text: string, userName: string, date: string}>>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

  useEffect(() => {
    if (visible && tradeId) {
      // Reset seller profile when switching to a new listing
      setSellerProfile(null);
      fetchTrade();
    } else {
      setTrade(null);
      setSellerProfile(null);
      setLoading(true);
    }
  }, [visible, tradeId]);

  const fetchTrade = async () => {
    if (!tradeId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/trades/${tradeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.trade) {
        setTrade(data.trade);
        // Ensure we have a valid offerer_user_id before fetching profile
        if (data.trade.offerer_user_id) {
          await fetchSellerProfile(data.trade.offerer_user_id);
        } else {
          console.error('Trade missing offerer_user_id:', data.trade);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerProfile = async (userId: string) => {
    if (!userId) {
      console.error('fetchSellerProfile called with empty userId');
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setSellerProfile(data.user);
        } else {
          console.error('No user data in response:', data);
        }
      } else {
        console.error('Failed to fetch seller profile:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch seller profile:', error);
    }
  };

  const formatPrice = () => {
    if (!trade) return '';
    if (trade.trade_options === 'Sell' && trade.price !== null) {
      return `$${trade.price.toFixed(2)}`;
    } else if (trade.trade_options === 'Trade') {
      return 'Trade';
    } else if (trade.trade_options === 'Looking for') {
      return 'Looking for';
    }
    return '';
  };

    const handleContactSeller = async () => {
    try {
      // 🧠 Step 1: get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const currentUserId = user.id;
      const sellerId = trade?.offerer_user_id;
      if (!sellerId || sellerId === currentUserId) return;

      // 🧠 Step 2: check if conversation already exists
      const { data: existingConversation, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${currentUserId})`)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      let conversationId = existingConversation?.id;

      // 🧠 Step 3: if none exists, create one
      if (!conversationId) {
        const { data: newConvo, error: insertError } = await supabase
          .from('conversations')
          .insert([
            { user1_id: currentUserId, user2_id: sellerId }
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        conversationId = newConvo.id;
      }

      // 🧠 Step 4: close modal + navigate to chat
      onClose();
      navigation.navigate('ChatScreen', {
        chatId: conversationId,
        contactName: trade?.title || 'Seller',
        receiverId: sellerId,
      });
    } catch (err: any) {
      console.error('Error creating or fetching conversation:', err.message);
    }
  };

  const handleSubmitReview = () => {
    if (userRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    const newReview = {
      id: Date.now().toString(),
      rating: userRating,
      text: reviewText,
      userName: 'Anonymous User',
      date: new Date().toLocaleDateString()
    };
    
    const newReviews = [...reviews, newReview];
    const newTotal = (averageRating * reviewCount) + userRating;
    const newCount = reviewCount + 1;
    const newAverage = newTotal / newCount;
    
    setReviews(newReviews);
    setAverageRating(newAverage);
    setReviewCount(newCount);
    setShowReviewModal(false);
    setReviewText('');
    setUserRating(0);
    
    Alert.alert('Success', 'Thank you for your review!');
  };

  return (
    <Modal visible={visible} animationType="none" presentationStyle="overFullScreen">
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : trade ? (
            <>
              {/* Images Section */}
              <View style={styles.imagesContainer}>
                {trade.image_urls && trade.image_urls.length > 0 ? (
                  trade.image_urls.slice(0, 2).map((url, index) => (
                    <Image
                      key={index}
                      source={{ uri: url }}
                      style={[styles.image, index > 0 && { marginLeft: 12 }]}
                      resizeMode="cover"
                    />
                  ))
                ) : (
                  <>
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={48} color="#9ca3af" />
                    </View>
                    <View style={[styles.imagePlaceholder, { marginLeft: 12 }]}>
                      <Ionicons name="image-outline" size={48} color="#9ca3af" />
                    </View>
                  </>
                )}
              </View>

              {/* Content Card */}
              <View style={styles.contentCard}>
                {/* Title and Rating */}
                <View style={styles.titleSection}>
                  <Text style={styles.titleText}>{trade.title || 'Untitled'}</Text>
                  <TouchableOpacity style={styles.ratingContainer} onPress={() => setShowReviewModal(true)}>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons 
                          key={star} 
                          name="star" 
                          size={16} 
                          color={star <= averageRating ? "#FFD700" : "#e5e5e5"} 
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingText}>{averageRating.toFixed(1)} ({reviewCount} Reviews)</Text>
                  </TouchableOpacity>
                  <View style={styles.priceContainer}>
                    <View style={styles.priceDot} />
                    <Text style={styles.priceText}>{formatPrice()}</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <View style={styles.bulletPoints}>
                    {trade.description ? (
                      trade.description.split('\n').map((line, index) => (
                        <View key={index} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{line.trim()}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>No description provided</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Seller Section */}
                <View style={styles.sellerSection}>
                  <Text style={styles.sectionTitle}>Seller</Text>
                  <TouchableOpacity 
                    style={styles.sellerInfo}
                    onPress={() => {
                      if (trade?.offerer_user_id && navigation) {
                        navigation.navigate('ProfileScreen', { userId: trade.offerer_user_id });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sellerAvatar}>
                      {sellerProfile?.profile_picture_url ? (
                        <Image 
                          source={{ uri: sellerProfile.profile_picture_url }} 
                          style={styles.sellerAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={24} color="#9ca3af" />
                      )}
                    </View>
                    <View style={styles.sellerDetails}>
                      <Text style={styles.sellerName}>
                        {sellerProfile?.user_name || 'Anonymous Seller'}
                      </Text>
                      <View style={styles.sellerRating}>
                        <Text style={styles.sellerRatingText}>
                          {sellerProfile?.rating?.toFixed(1) || '0.0'}
                        </Text>
                        <Ionicons name="star" size={14} color="#FFD700" />
                      </View>
                    </View>
                    <View style={styles.interestedSection}>
                      <Text style={styles.interestedTitle}>Interested to trade:</Text>
                      <View style={styles.interestTags}>
                        {sellerProfile?.interests && sellerProfile.interests.length > 0 ? (
                          sellerProfile.interests.slice(0, 3).map((interest, index) => (
                            <View key={index} style={styles.interestTag}>
                              <Text style={styles.interestText}>{interest}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noInterestsText}>No interests listed</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Reviews Section */}
                {reviews.length > 0 && (
                  <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviews.map((review) => (
                      <View key={review.id} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewUserName}>{review.userName}</Text>
                          <View style={styles.reviewStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons 
                                key={star} 
                                name="star" 
                                size={12} 
                                color={star <= review.rating ? "#FFD700" : "#e5e5e5"} 
                              />
                            ))}
                          </View>
                          <Text style={styles.reviewDate}>{review.date}</Text>
                        </View>
                        {review.text ? (
                          <Text style={styles.reviewText}>{review.text}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}


              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load listing</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action Buttons */}
        {trade && (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>Contact Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.offerButton} onPress={handleContactSeller}>
              <Text style={styles.offerButtonText}>Make an offer</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.reviewModal}>
          <ScreenHeader 
            title="Write a Review" 
            onBack={() => setShowReviewModal(false)}
            rightElement={
              <TouchableOpacity onPress={handleSubmitReview}>
                <Text style={styles.submitText} numberOfLines={1}>Submit</Text>
              </TouchableOpacity>
            }
          />
          
          <View style={styles.reviewContent}>
            <Text style={styles.rateLabel}>Rate this listing:</Text>
            <View style={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                  <Ionicons 
                    name="star" 
                    size={32} 
                    color={star <= userRating ? "#FFD700" : "#e5e5e5"} 
                    style={styles.ratingStar}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.reviewLabel}>Your review:</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this listing..."
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  image: {
    flex: 1,
    height: 280,
    borderRadius: 16,
  },
  imagePlaceholder: {
    flex: 1,
    height: 280,
    backgroundColor: '#e5e5e5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    paddingRight: 80,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#666666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  priceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  bulletPoints: {
    paddingLeft: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#999999',
    marginRight: 12,
    width: 16,
  },
  bulletText: {
    fontSize: 16,
    color: '#999999',
    flex: 1,
    lineHeight: 22,
  },
  sellerSection: {
    marginBottom: 32,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerDetails: {
    marginRight: 20,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerRatingText: {
    fontSize: 16,
    color: '#666666',
    marginRight: 4,
  },
  interestedSection: {
    flex: 1,
  },
  interestedTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  interestEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  interestText: {
    fontSize: 12,
    color: '#666666',
  },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  offerButton: {
    flex: 1,
    backgroundColor: '#2c3e50',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  offerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  reviewModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  submitText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  reviewContent: {
    padding: 20,
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  starRating: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  ratingStar: {
    marginRight: 8,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f8f8f8',
  },
  reviewsSection: {
    marginBottom: 32,
  },
  reviewItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666666',
  },
  reviewText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  noInterestsText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
});

