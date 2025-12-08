import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, petsAPI, transformPetData } from '../utils/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Функция для расчета дней на сайте
  const calculateDaysOnSite = (registrationDate) => {
    if (!registrationDate) return '1 день';
    
    try {
      const regDate = new Date(registrationDate);
      const now = new Date();
      const diffTime = Math.abs(now - regDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 день';
      if (diffDays < 5) return `${diffDays} дня`;
      if (diffDays < 21) return `${diffDays} дней`;
      if (diffDays < 30) return '3 недели';
      return `${Math.floor(diffDays / 30)} месяцев`;
    } catch (e) {
      return '1 день';
    }
  };

  const checkAuth = async () => {
    try {
      const token = authAPI.checkToken();
      if (token) {
        console.log('Token found, trying to get profile...');
        
        try {
          // Пытаемся получить профиль - в новой спецификации нужен userId
          // Пока что будем использовать тестовый userId или получим его из токена
          const testUserId = 1; // Временное решение
          const userData = await authAPI.getProfile(testUserId);
          console.log('User profile response:', userData);
          
          if (userData && userData.data && userData.data.user) {
            const user = userData.data.user[0];
            
            // Загружаем объявления пользователя
            let userAdsData = [];
            try {
              const myAdsResponse = await petsAPI.getMyPets(user.id);
              console.log('User ads response:', myAdsResponse);
              
              userAdsData = transformPetData(myAdsResponse) || [];
              console.log('Transformed user ads:', userAdsData);
            } catch (adsError) {
              console.error('Error loading user ads:', adsError);
            }
            
            const formattedUser = {
              id: user.id || 0,
              name: user.name || 'Пользователь',
              email: user.email || '',
              phone: user.phone || '',
              avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
              regDate: user.registrationDate ? 
                new Date(user.registrationDate).toLocaleDateString('ru-RU') : 
                new Date().toLocaleDateString('ru-RU'),
              daysOnSite: calculateDaysOnSite(user.registrationDate),
              completedAds: user.petsCount || 0,
              incompleteAds: user.ordersCount || 0,
            };
            
            console.log('Formatted user:', formattedUser);
            
            setCurrentUser(formattedUser);
            setUserAds(userAdsData);
            setIsAuthenticated(true);
            localStorage.setItem('currentUser', JSON.stringify(formattedUser));
          }
        } catch (profileError) {
          console.error('Profile load error:', profileError);
          authAPI.logout();
          setCurrentUser(null);
          setIsAuthenticated(false);
          setUserAds([]);
        }
      } else {
        console.log('No token found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authAPI.logout();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setUserAds([]);
    } finally {
      setLoading(false);
    }
  };

  // Обновим функции login и register
const login = async (credentials) => {
  try {
    console.log('Attempting login with:', credentials);
    const response = await authAPI.login(credentials);
    console.log('Login response:', response);
    
    // Сохраняем токен
    let token = '';
    if (response.data && response.data.token) {
      token = response.data.token;
    } else if (response.token) {
      token = response.token;
    }
    
    if (!token) {
      throw new Error('Токен не получен от сервера');
    }
    
    authAPI.saveToken(token);
    
    // Создаем временного пользователя
    const user = {
      id: 1, // Временный ID
      name: credentials.email.split('@')[0] || 'Пользователь',
      email: credentials.email,
      phone: '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      regDate: new Date().toLocaleDateString('ru-RU'),
      daysOnSite: '1 день',
      completedAds: 0,
      incompleteAds: 0,
    };
    
    console.log('User created:', user);
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const register = async (userData) => {
  try {
    console.log('Attempting register with:', userData);
    const response = await authAPI.register(userData);
    console.log('Register response:', response);
    
    // Сохраняем токен, если он есть
    let token = '';
    if (response.data && response.data.token) {
      token = response.data.token;
    } else if (response.token) {
      token = response.token;
    }
    
    if (token) {
      authAPI.saveToken(token);
    }
    
    // Создаем пользователя
    const user = {
      id: 0,
      name: userData.name || 'Пользователь',
      email: userData.email || '',
      phone: userData.phone || '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
      regDate: new Date().toLocaleDateString('ru-RU'),
      daysOnSite: '1 день',
      completedAds: 0,
      incompleteAds: 0,
    };
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

  const logout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUserAds([]);
  };

  const updateUser = async (updatedData) => {
    try {
      if (!currentUser?.id) throw new Error('ID пользователя не найден');
      
      if (updatedData.phone) {
        await authAPI.updatePhone(currentUser.id, updatedData.phone);
      }
      
      if (updatedData.email) {
        await authAPI.updateEmail(currentUser.id, updatedData.email);
      }
      
      const updatedUser = { 
        ...currentUser, 
        ...updatedData,
        daysOnSite: calculateDaysOnSite(currentUser.regDate)
      };
      
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  };

  const addUserAd = async (adData) => {
    try {
      console.log('Adding user ad:', adData);
      const response = await petsAPI.createPet(adData);
      const transformedAd = transformPetData(response);
      
      setUserAds(prev => {
        const newAds = [...prev, transformedAd];
        const updatedUser = {
          ...currentUser,
          incompleteAds: (currentUser.incompleteAds || 0) + 1,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return newAds;
      });
      
      return transformedAd;
    } catch (error) {
      console.error('Add ad failed:', error);
      throw error;
    }
  };

  const updateUserAd = async (adId, updatedData) => {
    try {
      const response = await petsAPI.updatePet(adId, updatedData);
      const transformedAd = transformPetData(response);
      
      setUserAds(prev => 
        prev.map(ad => 
          ad.id === adId ? { ...ad, ...transformedAd } : ad
        )
      );
      
      return transformedAd;
    } catch (error) {
      console.error('Update ad failed:', error);
      throw error;
    }
  };

  const deleteUserAd = async (adId) => {
    try {
      await petsAPI.deletePet(adId);
      
      setUserAds(prev => {
        const newAds = prev.filter(ad => ad.id !== adId);
        const updatedUser = {
          ...currentUser,
          incompleteAds: Math.max(0, (currentUser.incompleteAds || 0) - 1),
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return newAds;
      });
      
    } catch (error) {
      console.error('Delete ad failed:', error);
      throw error;
    }
  };

  const refreshUserAds = async () => {
    try {
      if (!currentUser?.id) throw new Error('ID пользователя не найден');
      
      const myAdsResponse = await petsAPI.getMyPets(currentUser.id);
      let userAdsData = transformPetData(myAdsResponse) || [];
      
      setUserAds(userAdsData);
      
      const updatedUser = {
        ...currentUser,
        incompleteAds: userAdsData.filter(ad => ad.adStatus === 'active' || ad.adStatus === 'onModeration').length,
        completedAds: userAdsData.filter(ad => ad.adStatus === 'wasFound').length,
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Refresh ads failed:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    currentUser,
    userAds,
    loading,
    login,
    register,
    logout,
    updateUser,
    addUserAd,
    updateUserAd,
    deleteUserAd,
    refreshUserAds,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};