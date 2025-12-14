import React, { useState, useEffect, useCallback } from 'react';
import { Carousel, Card, Button, Form, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PetCard from './PetCard';
import { petsAPI, subscriptionAPI, transformPetData } from '../utils/apiService';
import { getFirstPetImage } from '../utils/helpers';

const Home = ({ showPetDetails }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [homeAds, setHomeAds] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функция для отладки данных API
  const debugAPIData = (data, source) => {
    console.group(`=== API Data Debug (${source}) ===`);
    console.log('Full API response:', data);
    
    if (data && data.pets && Array.isArray(data.pets)) {
      data.pets.forEach((pet, index) => {
        console.group(`Pet ${index} (ID: ${pet.id})`);
        console.log('Type:', pet.type);
        console.log('Photos array:', pet.photos);
        console.log('Image field:', pet.image);
        console.log('Original data:', pet.originalData);
        
        // Проверяем originalData
        if (pet.originalData) {
          console.log('OriginalData photos:', pet.originalData.photos);
          console.log('OriginalData image:', pet.originalData.image);
          console.log('OriginalData photo1:', pet.originalData.photo1);
          console.log('OriginalData photo2:', pet.originalData.photo2);
          console.log('OriginalData photo3:', pet.originalData.photo3);
        }
        
        // Получаем изображение для проверки
        const imageUrl = getFirstPetImage(pet);
        console.log('Final image URL:', imageUrl);
        
        console.groupEnd();
      });
    }
    console.groupEnd();
  };

  // Загрузка данных
  // В функции loadData обновляем получение объявлений:
const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('Loading home page data...');
    
    // Загружаем слайдер
    try {
      const sliderResponse = await petsAPI.getSlider();
      console.log('Slider API response:', sliderResponse);
      const sliderData = transformPetData(sliderResponse, 'slider');
      debugAPIData(sliderData, 'slider');
      
      if (sliderData.pets && sliderData.pets.length > 0) {
        console.log('Slider pets with images:');
        sliderData.pets.forEach((pet, index) => {
          console.log(`Pet ${index} (${pet.type}):`, {
            id: pet.id,
            type: pet.type,
            photos: pet.photos,
            originalData: pet.originalData
          });
        });
        
        const carouselWithImages = sliderData.pets.map(pet => {
          const imageUrl = getFirstPetImage(pet) || 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
          console.log(`Carousel image for pet ${pet.id}: ${imageUrl}`);
          return {
            ...pet,
            image: imageUrl,
            description: pet.description || `Найдена ${pet.type || 'животное'}`
          };
        });
        setCarouselItems(carouselWithImages);
      } else {
        console.log('No slider data, using fallback');
        setCarouselItems(getFallbackCarousel());
      }
    } catch (sliderError) {
      console.error('Ошибка загрузки слайдера:', sliderError);
      setCarouselItems(getFallbackCarousel());
    }
    
    // Загружаем объявления с API
    try {
      console.log('Fetching home ads from API...');
      
      const response = await petsAPI.getAllPets(1, 6);
      console.log('API response for home ads:', response);
      
      if (response.data && response.data.pets) {
        console.log(`Found ${response.data.pets.length} pets in API response`);
        
        // Преобразуем данные
        const transformedData = transformPetData(response, 'pets');
        const petsData = transformedData.pets || [];
        
        // Сортируем по дате (новые первыми)
        const sortedPets = [...petsData].sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });
        
        console.log('Transformed pets data for home:', sortedPets);
        setHomeAds(sortedPets);
      } else {
        console.log('No pets data, using fallback');
        setHomeAds(getFallbackPets());
      }
      
    } catch (petsError) {
      console.error('Ошибка загрузки объявлений:', petsError);
      setHomeAds(getFallbackPets());
    }
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
    setCarouselItems(getFallbackCarousel());
    setHomeAds(getFallbackPets());
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    loadData();
    
    // Загружаем локальные объявления из localStorage
    const loadLocalPets = () => {
      try {
        const localPets = JSON.parse(localStorage.getItem('localPets') || '[]');
        if (localPets.length > 0) {
          console.log('Local pets loaded:', localPets.length);
          
          // Преобразуем локальные объявления в формат для PetCard
          const transformedLocalPets = localPets.map(localPet => ({
            id: localPet.id,
            type: localPet.type || 'другое',
            status: localPet.status || 'found',
            name: localPet.name || '',
            description: localPet.description || '',
            district: localPet.district || '',
            date: localPet.date || '',
            photos: localPet.localPhotos || localPet.photos || [],
            userPhone: localPet.userPhone || '',
            userEmail: localPet.userEmail || '',
            userName: localPet.userName || '',
            registered: false,
            mark: localPet.mark || '',
            isLocal: true,
            originalData: localPet,
          }));
          
          // Добавляем локальные объявления к основным (максимум 6 всего)
          setHomeAds(prev => {
            const allPets = [...prev, ...transformedLocalPets];
            // Сортируем по дате (новые первые) и берем первые 6
            return allPets
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 6);
          });
        }
      } catch (error) {
        console.error('Error loading local pets:', error);
      }
    };
    
    loadLocalPets();
  }, [loadData]);

  // Fallback данные для карусели
  const getFallbackCarousel = () => [
    {
      id: 1,
      type: 'собака',
      description: 'Найдены хозяева для многих животных благодаря нашему сервису',
      image: 'https://images.unsplash.com/photo-1589652043056-ba1a2c4830a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 2,
      type: 'кошка',
      description: 'Помогаем найти потерянных питомцев с 2023 года',
      image: 'https://images.unsplash.com/photo-1550358864-518f202c02ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 3,
      type: 'птица',
      description: 'Присоединяйтесь к нашему сообществу',
      image: 'https://images.unsplash.com/photo-1557170339-0d91a6d3d8e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Fallback данные для объявлений
  const getFallbackPets = () => [
    {
      id: 1,
      type: 'собака',
      status: 'found',
      name: 'Рекс',
      description: 'Найдена собака породы немецкая овчарка в Красногвардейском районе',
      district: 'krasnogvardeyskiy',
      date: '10.05.2023',
      photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop'],
      registered: false,
      isFromAPI: false,
    },
    {
      id: 2,
      type: 'кошка',
      status: 'lost',
      name: 'Мурка',
      description: 'Потеряна кошка в центре города возле метро',
      district: 'tsentralnyy',
      date: '15.05.2023',
      photos: ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&h=400&fit=crop'],
      registered: false,
      isFromAPI: false,
    },
    {
      id: 3,
      type: 'птица',
      status: 'found',
      name: 'Кеша',
      description: 'Найден попугай в Московском районе',
      district: 'moskovskiy',
      date: '20.05.2023',
      photos: ['https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop'],
      registered: false,
      isFromAPI: false,
    },
  ];

  // Подписка на новости
  const handleSubscription = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setSubscriptionError('Пожалуйста, введите email');
      return;
    }
    
    try {
      setSubscriptionError('');
      await subscriptionAPI.subscribe(email);
      setSubscribed(true);
      setEmail('');
      
      setTimeout(() => {
        setSubscribed(false);
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка подписки:', error);
      setSubscriptionError(error.message || 'Ошибка при подписке. Пожалуйста, попробуйте снова.');
    }
  };

  const handleSelect = (selectedIndex) => {
    setCarouselIndex(selectedIndex);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-2">Загрузка данных...</p>
      </Container>
    );
  }

  return (
    <div id="home">
      {/* Карусель с животными, у которых нашли хозяев */}
      <section className="mb-5 carousel-full-width">
        <h2 className="text-center text-dark py-2 rounded mb-4 mx-3">Найденные питомцы</h2>
        
        {error && (
          <Alert variant="warning" className="text-center">
            {error}
            <Button variant="outline-dark" size="sm" className="ms-3" onClick={loadData}>
              Повторить
            </Button>
          </Alert>
        )}
        
        <Carousel 
          activeIndex={carouselIndex} 
          onSelect={handleSelect}
          interval={4000}
          className="carousel slide"
        >
          {carouselItems.map((item, index) => (
            <Carousel.Item key={index}>
              <div 
                className="carousel-image-container"
                style={{
                  height: '400px',
                  width: '100%',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <img
                  className="carousel-image"
                  src={item.image || 'https://via.placeholder.com/1200x400?text=Нет+фото'}
                  alt={item.type || 'Животное'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onError={(e) => {
                    console.error(`Error loading image for ${item.type}:`, e.target.src);
                    e.target.src = 'https://via.placeholder.com/1200x400?text=Нет+фото';
                  }}
                />
              </div>
              <Carousel.Caption className="bg-dark bg-opacity-75 rounded p-3">
                <h3>{item.type || 'Животное'}</h3>
                <p>{item.description || 'Нуждается в помощи'}</p>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>

      {/* Карточки животных */}
      <section className="mb-5 container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white bg-dark py-2 px-4 rounded">Последние объявления</h2>
          <Button variant="outline-dark" onClick={loadData} disabled={loading}>
            {loading ? 'Обновление...' : 'Обновить'}
          </Button>
        </div>
        
        <Row className="g-4" id="homePetsContainer">
          {homeAds.length > 0 ? (
            homeAds.map(pet => {
              console.log(`Rendering pet ${pet.id} for home page:`, {
                id: pet.id,
                type: pet.type,
                status: pet.status, // Добавлено для отладки
                photosCount: pet.photos ? pet.photos.length : 0,
                photos: pet.photos,
                isFromAPI: pet.isFromAPI,
                hasOriginalData: !!pet.originalData
              });
              return (
                <Col key={pet.id} md={6} lg={4}>
                  <PetCard pet={pet} onShowDetails={() => showPetDetails(pet)} />
                </Col>
              );
            })
          ) : (
            <Col className="text-center py-5">
              <Alert variant="info">
                <p className="mb-3">Пока нет активных объявлений о животных</p>
                <div className="d-flex justify-content-center gap-3">
                  <Button as={Link} to="/add-pet" variant="dark">
                    Добавить объявление
                  </Button>
                  <Button variant="outline-dark" onClick={loadData}>
                    Обновить
                  </Button>
                </div>
              </Alert>
            </Col>
          )}
        </Row>
      </section>

      {/* Подписка на новости */}
      <section className="mb-5 container">
        <h2 className="text-center text-white bg-dark py-2 rounded mb-4">Подписка на новости</h2>
        <Row className="justify-content-center">
          <Col md={6}>
            <Form 
              className="border rounded p-4 bg-light" 
              onSubmit={handleSubscription}
            >
              {subscribed && (
                <Alert variant="success" className="alert-custom">
                  Спасибо за подписку!
                </Alert>
              )}
              
              {subscriptionError && (
                <Alert variant="danger" className="alert-custom">
                  {subscriptionError}
                </Alert>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label className="required-field">
                  Введите адрес электронной почты
                </Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSubscriptionError('');
                  }}
                  required
                  placeholder="example@mail.ru"
                />
                <Form.Text className="text-muted">
                  Мы никогда не делимся Вашими e-mail ни с кем.
                </Form.Text>
              </Form.Group>
              
              <Button type="submit" variant="dark" className="w-100" disabled={subscribed}>
                {subscribed ? 'Подписано' : 'Подписаться'}
              </Button>
            </Form>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default Home;