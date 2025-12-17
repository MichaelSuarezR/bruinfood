import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

type HomeScreenProps = {
  onSeeAllNew?: () => void;
  onSeeAllRecommended?: () => void;
  onSeeAllAll?: () => void;
  onSearchPress?: () => void;
  onTradePress?: (id: string) => void;
};

type DiningHall = {
  id: string;
  name: string;
  neighborhood: string;
  status: 'open' | 'closed' | 'busy' | 'unknown';
  waitTime: string;
  closesAt: string;
  rating: number;
  description: string;
  specialties: string[];
  image: string;
  statusDetail?: string;
  liveStatusText?: string;
  activityLevel?: number;
};

type LiveDiningStatus = {
  id: string;
  status: DiningHall['status'];
  statusText?: string;
  statusDetail?: string;
  activityLevel?: number;
  isOpen?: boolean;
  lastUpdated?: string;
};

const QUICK_FILTERS = ['Breakfast', 'Lunch', 'Dinner', 'Late Night', 'Grab & Go'];

const BASE_DINING_HALLS: DiningHall[] = [
  {
    id: 'epicuria-ackerman',
    name: 'Epic at Ackerman',
    neighborhood: 'Ackerman Union',
    status: 'open',
    waitTime: 'Live data coming...',
    closesAt: 'Hours refresh below',
    rating: 4.6,
    description: 'Chef-driven Mediterranean plates, wood-fired pizzas, pasta and patisserie vibes in Ackerman Union.',
    specialties: ['Small Plates', 'Fresh Pasta', 'Pastries'],
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=60',
  },
  {
    id: 'bruin-cafe',
    name: 'Bruin Café',
    neighborhood: 'Sproul Hall',
    status: 'open',
    waitTime: 'Live data coming...',
    closesAt: 'Hours refresh below',
    rating: 4.5,
    description: 'Cold brew, artisan sandwiches, and grab-and-go bites perfect for study sessions.',
    specialties: ['Cold Brew', 'Paninis', 'Grab & Go'],
    image: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=800&q=60',
  },
  {
    id: 'rendezvous',
    name: 'Rendezvous',
    neighborhood: 'Rieber Terrace',
    status: 'open',
    waitTime: 'Live data coming...',
    closesAt: 'Hours refresh below',
    rating: 4.4,
    description: 'Late-night tacos, burritos, ramen, and pan-Asian fusion favorites.',
    specialties: ['Tacos', 'Burritos', 'Bubble Tea'],
    image: 'https://images.unsplash.com/photo-1481931715705-36f5f79f1fe1?auto=format&fit=crop&w=800&q=60',
  },
  {
    id: 'hedrick-study',
    name: 'The Study at Hedrick',
    neighborhood: 'Hedrick Hall',
    status: 'open',
    waitTime: 'Live data coming...',
    closesAt: 'Hours refresh below',
    rating: 4.3,
    description: 'Cafe lounge with all-day breakfast, waffles, smoothies, and a chill study atmosphere.',
    specialties: ['Waffles', 'Smoothies', 'Study Snacks'],
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=60',
  },
];

const STATUS_COLORS: Record<DiningHall['status'], string> = {
  open: '#22c55e',
  busy: '#f97316',
  closed: '#ef4444',
  unknown: '#6b7280',
};

export default function HomeScreen(_: HomeScreenProps) {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveDiningStatus>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  const handleDiningHallPress = (hall: DiningHall) => {
    Alert.alert(
      hall.name,
      'Menus and live ordering are coming soon for this dining hall.',
      [{ text: 'Got it' }],
    );
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStatuses = async () => {
      try {
        setLoadingStatuses(true);
        const response = await fetch(`${apiUrl}/api/dining/status`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const payload = await response.json();
        if (!isMounted) return;

        const nextStatuses: Record<string, LiveDiningStatus> = {};
        (payload?.halls ?? []).forEach((hall: LiveDiningStatus) => {
          if (hall?.id) {
            nextStatuses[hall.id] = hall;
          }
        });
        setLiveStatuses(nextStatuses);
      } catch (error) {
        console.error('Failed to load dining hall statuses', error);
      } finally {
        if (isMounted) {
          setLoadingStatuses(false);
        }
      }
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiUrl]);

  const getWaitEstimate = (activityLevel?: number): string => {
    if (typeof activityLevel !== 'number') {
      return 'Live wait unavailable';
    }
    if (activityLevel < 35) return 'No wait';
    if (activityLevel < 65) return '10-15 min';
    return '20+ min';
  };

  const diningHalls = useMemo(() => {
    return BASE_DINING_HALLS.map((hall) => {
      const live = liveStatuses[hall.id];
      if (!live) return hall;

      const status = STATUS_COLORS[live.status] ? live.status : hall.status;
      return {
        ...hall,
        status,
        liveStatusText: live.statusText ?? hall.liveStatusText,
        statusDetail: live.statusDetail ?? hall.statusDetail,
        activityLevel: live.activityLevel ?? hall.activityLevel,
        waitTime: getWaitEstimate(live.activityLevel),
        closesAt: live.statusDetail ?? hall.closesAt,
      };
    });
  }, [liveStatuses]);

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Delivering from UCLA dining</Text>
        <Text style={styles.heroTitle}>Where are we eating tonight?</Text>
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Ionicons name="location-sharp" size={16} color="#2563eb" />
            <Text style={styles.heroStatText}>Westwood Campus</Text>
          </View>
          <View style={styles.heroStat}>
            <Ionicons name="time-outline" size={16} color="#2563eb" />
            <Text style={styles.heroStatText}>Next pickup ~20 mins</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.heroButton}>
          <Text style={styles.heroButtonText}>Schedule order</Text>
          <MaterialIcons name="arrow-forward-ios" size={14} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by meal</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>View weekly menu</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {QUICK_FILTERS.map((filter) => (
            <TouchableOpacity key={filter} style={styles.filterPill}>
              <Text style={styles.filterPillText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dining halls today</Text>
          <Text style={styles.sectionSubtitle}>
            Live wait times &amp; closing hours {loadingStatuses ? '(Refreshing...)' : ''}
          </Text>
        </View>

        {diningHalls.map((hall) => (
          <TouchableOpacity
            key={hall.id}
            style={styles.hallCard}
            activeOpacity={0.85}
            onPress={() => handleDiningHallPress(hall)}
          >
            <Image source={{ uri: hall.image }} style={styles.hallImage} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.hallName}>{hall.name}</Text>
                  <Text style={styles.hallNeighborhood}>{hall.neighborhood}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${STATUS_COLORS[hall.status]}22` },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[hall.status] }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLORS[hall.status] }]}>
                    {hall.liveStatusText
                      ? hall.liveStatusText
                      : hall.status === 'busy'
                        ? 'Busy'
                        : hall.status === 'closed'
                          ? 'Closed'
                          : hall.status === 'open'
                            ? 'Open'
                            : 'Status unknown'}
                  </Text>
                </View>
              </View>

              <Text style={styles.hallDescription}>{hall.description}</Text>
              {hall.statusDetail && (
                <Text style={styles.statusDetailText}>{hall.statusDetail}</Text>
              )}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#2563eb" />
                  <Text style={styles.metaText}>{hall.waitTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="alarm-outline" size={16} color="#2563eb" />
                  <Text style={styles.metaText}>{hall.closesAt}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="pulse-outline" size={16} color="#2563eb" />
                  <Text style={styles.metaText}>
                    {typeof hall.activityLevel === 'number'
                      ? `${hall.activityLevel}% active`
                      : 'Activity unknown'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.metaText}>{hall.rating.toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.tagsRow}>
                {hall.specialties.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  heroCard: {
    backgroundColor: '#1d4ed8',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  heroEyebrow: {
    color: '#bfdbfe',
    fontSize: 14,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroStatText: {
    color: '#f1f5f9',
    fontWeight: '500',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#93c5fd',
    borderRadius: 999,
    paddingVertical: 10,
  },
  heroButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  sectionAction: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  filterRow: {
    gap: 12,
    paddingVertical: 8,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  filterPillText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  hallCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 3,
  },
  hallImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  hallName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  hallNeighborhood: {
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '600',
  },
  hallDescription: {
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusDetailText: {
    color: '#1f2937',
    marginTop: -8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  metaText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
  },
  tagText: {
    color: '#0f172a',
    fontWeight: '500',
  },
});
