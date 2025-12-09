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
        console.log('Token found, checking authentication...');
        
        try {
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            setIsAuthenticated(true);
            
            try {
              const myAdsResponse = await petsAPI.getMyPets(user.id);
              const transformedData = transformPetData(myAdsResponse);
              setUserAds(transformedData.pets || []);
            } catch (adsError) {
              console.error('Error loading user ads:', adsError);
              setUserAds([]);
            }
          } else {
            const testUser = {
              id: 1,
              name: 'Тестовый Пользователь',
              email: 'test@example.com',
              phone: '+7 (123) 456-78-90',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
              regDate: new Date().toLocaleDateString('ru-RU'),
              daysOnSite: calculateDaysOnSite(new Date()),
              completedAds: 0,
              incompleteAds: 0,
            };
            
            setCurrentUser(testUser);
            setIsAuthenticated(true);
            localStorage.setItem('currentUser', JSON.stringify(testUser));
          }
        } catch (profileError) {
          console.error('Profile load error:', profileError);
          setIsAuthenticated(true);
        }
      } else {
        console.log('No token found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      
      if (credentials.email && credentials.password) {
        const user = {
          id: 1,
          name: credentials.email.split('@')[0] || 'Пользователь',
          email: credentials.email,
          phone: '+7 (123) 456-78-90',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          regDate: new Date().toLocaleDateString('ru-RU'),
          daysOnSite: calculateDaysOnSite(new Date()),
          completedAds: 0,
          incompleteAds: 0,
        };
        
        authAPI.saveToken('test_token_12345');
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('Login successful, user:', user);
        return user;
      } else {
        throw new Error('Неверные учетные данные');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting register with:', userData);
      
      if (userData.email && userData.password) {
        const user = {
          id: Date.now(),
          name: userData.name || userData.email.split('@')[0] || 'Пользователь',
          email: userData.email,
          phone: userData.phone || '',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
          regDate: new Date().toLocaleDateString('ru-RU'),
          daysOnSite: calculateDaysOnSite(new Date()),
          completedAds: 0,
          incompleteAds: 0,
        };
        
        authAPI.saveToken('test_token_' + Date.now());
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('Registration successful, user:', user);
        return user;
      } else {
        throw new Error('Не все обязательные поля заполнены');
      }
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
      if (!currentUser) throw new Error('Пользователь не найден');
      
      const updatedUser = { 
        ...currentUser, 
        ...updatedData
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
      
      const newAd = {
        id: Date.now(),
        type: 'другое',
        status: 'found',
        name: 'Тестовое животное',
        description: 'Новое объявление',
        district: '1',
        date: new Date().toLocaleDateString('ru-RU'),
        userName: currentUser?.name || 'Пользователь',
        userPhone: currentUser?.phone || '',
        userEmail: currentUser?.email || '',
        photos: ['https://images.unsplash.com/photo-1589652043056-ba1a2c4830a5?w=300&auto=format&fit=crop'],
        adStatus: 'active',
        author: currentUser?.name || 'Пользователь',
        registered: true
      };
      
      setUserAds(prev => {
        const newAds = [...prev, newAd];
        const updatedUser = {
          ...currentUser,
          incompleteAds: (currentUser?.incompleteAds || 0) + 1,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return newAds;
      });
      
      return newAd;
    } catch (error) {
      console.error('Add ad failed:', error);
      throw error;
    }
  };

  const updateUserAd = async (adId, updatedData) => {
    try {
      setUserAds(prev => 
        prev.map(ad => 
          ad.id === adId ? { ...ad, ...updatedData } : ad
        )
      );
      
      return updatedData;
    } catch (error) {
      console.error('Update ad failed:', error);
      throw error;
    }
  };

  const deleteUserAd = async (adId) => {
    try {
      setUserAds(prev => {
        const newAds = prev.filter(ad => ad.id !== adId);
        const updatedUser = {
          ...currentUser,
          incompleteAds: Math.max(0, (currentUser?.incompleteAds || 0) - 1),
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
      if (!currentUser?.id) throw new Error('Пользователь не найден');
      
      const updatedUser = {
        ...currentUser,
        incompleteAds: userAds.filter(ad => ad.adStatus === 'active').length,
        completedAds: userAds.filter(ad => ad.adStatus === 'wasFound').length,
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