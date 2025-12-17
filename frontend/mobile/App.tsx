import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import MessagesLandingScreen from './screens/MessagesLandingScreen';
import ChatScreen from './screens/ChatScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import SeeAllScreen from './screens/SeeAllScreen';
import ListingDetailScreen from './screens/ListingDetailScreen';
import BottomNavigation from './components/BottomNavigation';
import { supabase } from './lib/supabaseClient';
import { NavigationContainer } from '@react-navigation/native';


type Screen = 'home' | 'search' | 'profile' | 'messages';
type AuthScreen = 'login' | 'register';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [initializing, setInitializing] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showSeeAll, setShowSeeAll] = useState(false);
  const [seeAllType, setSeeAllType] = useState<'new' | 'recommended' | 'all'>('new');
  const [showChat, setShowChat] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [currentContactName, setCurrentContactName] = useState<string>('');
  const [showListingDetail, setShowListingDetail] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<{ screen: Screen; showSeeAll?: boolean; seeAllType?: 'new' | 'recommended' | 'all' } | null>(null);

  const handleSeeAll = (type: 'new' | 'recommended' | 'all') => {
    setSeeAllType(type);
    setShowSeeAll(true);
  };

  const handleChatPress = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChat(true);
  };

  const handleChatBack = () => {
    setShowChat(false);
    setCurrentChatId('');
  };

  const handleTradePress = (tradeId: string) => {
    // Store current navigation state
    setPreviousScreen({
      screen: currentScreen,
      showSeeAll: showSeeAll,
      seeAllType: showSeeAll ? seeAllType : undefined
    });
    
    setSelectedTradeId(tradeId);
    setShowListingDetail(true);
    setShowSeeAll(false); // Close SeeAll screen when navigating to listing detail
  };

  const handleListingDetailClose = () => {
    setShowListingDetail(false);
    setSelectedTradeId(null);
    
    // Restore previous navigation state
    if (previousScreen) {
      setCurrentScreen(previousScreen.screen);
      if (previousScreen.showSeeAll) {
        setShowSeeAll(true);
        setSeeAllType(previousScreen.seeAllType || 'new');
      }
      setPreviousScreen(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session) {
          setIsLoggedIn(true);
          setAuthScreen('login');
        } else {
          setIsLoggedIn(false);
          setAuthScreen('login');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // SeeAllScreen will fetch data from API, pass empty array for now
  const listings: any[] = [];

  if (initializing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  // Show auth screens if not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="auto" />
        {authScreen === 'register' ? (
          <RegisterScreen
            onRegister={({ loggedIn }) => {
              if (loggedIn) {
                setIsLoggedIn(true);
              } else {
                setIsLoggedIn(false);
              }
              setAuthScreen('login');
            }}
            onSwitchToLogin={() => setAuthScreen('login')}
          />
        ) : (
          <LoginScreen 
            onLogin={() => {
              setIsLoggedIn(true);
              setAuthScreen('login');
            }} 
            onSwitchToRegister={() => setAuthScreen('register')}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="auto" />
        
        {currentScreen === 'home' && (
          <HomeScreen 
            onSeeAllNew={() => handleSeeAll('new')}
            onSeeAllRecommended={() => handleSeeAll('recommended')}
            onSeeAllAll={() => handleSeeAll('all')}
            onSearchPress={() => setCurrentScreen('search')}
            onTradePress={handleTradePress}
          />
        )}
        
        {currentScreen === 'search' && (
          <SearchScreen onTradePress={handleTradePress} />
        )}
        
        {currentScreen === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentScreen('home')}
            onLogout={() => {
              setIsLoggedIn(false);
              setAuthScreen('login');
            }}
          />
        )}
        
        {currentScreen === 'messages' && !showChat && (
          <MessagesLandingScreen onChatPress={handleChatPress} />
        )}
        
        {showChat && (
          <ChatScreen
            chatId={currentChatId}
            contactName={currentContactName}
            onBack={handleChatBack}
          />
        )}

        <BottomNavigation 
          currentScreen={currentScreen}
          onHomePress={() => setCurrentScreen('home')}
          onSearchPress={() => setCurrentScreen('search')}
          onMessagesPress={() => setCurrentScreen('messages')}
          onProfilePress={() => setCurrentScreen('profile')}
          onAddPress={() => setShowCreateListing(true)} 
        />

        {/* Create Listing Modal */}
        {showCreateListing && (
          <CreateListingScreen onClose={() => setShowCreateListing(false)} />
        )}

        {/* See All Screen */}
        <SeeAllScreen
          visible={showSeeAll}
          type={seeAllType}
          onClose={() => setShowSeeAll(false)}
          onTradePress={handleTradePress}
          currentScreen={currentScreen}
          onHomePress={() => setCurrentScreen('home')}
          onSearchPress={() => setCurrentScreen('search')}
          onMessagesPress={() => setCurrentScreen('messages')}
          onProfilePress={() => setCurrentScreen('profile')}
          onAddPress={() => setShowCreateListing(true)}
        />

        {/* Listing Detail Screen */}
        <ListingDetailScreen
          visible={showListingDetail}
          tradeId={selectedTradeId}
          onClose={handleListingDetailClose}
          navigation={{
            navigate: (screen: string, params?: any) => {
              if (screen === 'ChatScreen') {
                // ✅ Switch to Messages tab
                setCurrentScreen('messages');

                // ✅ Ensure chat shows after switching
                setTimeout(() => {
                  setShowChat(true);
                  if (params?.chatId) setCurrentChatId(params.chatId);
                  if (params?.contactName) setCurrentContactName(params.contactName);
                }, 150);
              }
            },
          }}
        />
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
