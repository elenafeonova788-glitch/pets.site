import React, { useState, useEffect } from 'react';
import { Carousel, Card, Button, Form, Alert, Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PetCard from './PetCard';
import { petsAPI, transformPetData, subscriptionAPI } from '../utils/apiService';
import { getFullImageUrl } from '../utils/imageUtils';

const Home = ({ showPetDetails }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [homeAds, setHomeAds] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем слайдер и объявления параллельно
      const [sliderResponse, petsResponse] = await Promise.allSettled([
        petsAPI.getSlider(),
        petsAPI.getAllPets(1, 6) // 6 объявлений на главной
      ]);
      
      // Обрабатываем слайдер
      if (sliderResponse.status === 'fulfilled') {
        const sliderData = sliderResponse.value;
        console.log('Slider data:', sliderData);
        
        let transformedSlider = [];
        if (sliderData && sliderData.data && sliderData.data.pets && Array.isArray(sliderData.data.pets)) {
          transformedSlider = sliderData.data.pets.map((item, index) => ({
            image: getFullImageUrl(item.image || item.photo || item.photo1),
            title: item.kind || `Животное ${index + 1}`,
            description: item.description || 'Нуждается в помощи',
            petId: item.id || index,
          }));
        }
        
        setCarouselItems(transformedSlider.length > 0 ? transformedSlider : getFallbackCarousel());
      } else {
        setCarouselItems(getFallbackCarousel());
      }
      
      // Обрабатываем объявления
      if (petsResponse.status === 'fulfilled') {
        const petsData = petsResponse.value;
        console.log('Pets data:', petsData);
        
        const transformedData = transformPetData(petsData);
        console.log('Transformed pets:', transformedData);
        
        setHomeAds(transformedData.pets || []);
        
        if (!transformedData.pets || transformedData.pets.length === 0) {
          setHomeAds(getFallbackPets());
        }
      } else {
        setHomeAds(getFallbackPets());
      }
      
    } catch (error) {
      console.error('Load data error:', error);
      setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      setCarouselItems(getFallbackCarousel());
      setHomeAds(getFallbackPets());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackCarousel = () => [
    {
      image: "https://images.unsplash.com/photo-1589652043056-ba1a2c4830a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "Помогите найти питомцев",
      description: "На нашем сайте вы можете найти потерянных животных или сообщить о найденных"
    },
    {
      image: "https://images.unsplash.com/photo-1550358864-518f202c02ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "Объединим усилия",
      description: "Вместе мы сможем помочь большему количеству животных"
    },
    {
      image: "https://images.unsplash.com/photo-1557170339-0d91a6d3d8e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      title: "Добавьте объявление",
      description: "Расскажите о потерянном или найденном животном"
    }
  ];

  const getFallbackPets = () => [
    {
      id: 1,
      type: 'собака',
      status: 'found',
      name: 'Рекс',
      description: 'Пропала немецкая овчарка. Крупная, черно-подпалого окраса.',
      district: '7',
      date: '10.05.2023',
      userName: 'Иван Иванов',
      userPhone: '+7 (911) 123-45-67',
      userEmail: 'rex@example.com',
      photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=60'],
      adStatus: 'active',
      author: 'Иван Иванов',
      registered: true
    },
    {
      id: 2,
      type: 'кошка',
      status: 'found',
      name: 'Мурка',
      description: 'Найдена пушистая кошечка. Очень ласковая, хорошо ухоженная.',
      district: '15',
      date: '15.05.2023',
      userName: 'Мария Петрова',
      userPhone: '+7 (912) 234-56-78',
      userEmail: 'murka@example.com',
      photos: ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&auto=format&fit=crop&q=60'],
      adStatus: 'active',
      author: 'Мария Петрова',
      registered: false
    }
  ];

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
      setTimeout(() => setSubscribed(false), 3000);
    } catch (error) {
      console.error('Subscription error:', error);
      setSubscriptionError(error.message || 'Ошибка при подписке');
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
      {/* Карусель */}
      <section className="mb-5 carousel-full-width">
        <h2 className="text-center text-dark py-2 rounded mb-4 mx-3">Найденные питомцы</h2>
        {error && <Alert variant="warning" className="text-center">{error}</Alert>}
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
                  src={item.image}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                />
              </div>
              <Carousel.Caption className="bg-dark bg-opacity-75 rounded p-3">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>

      {/* Карточки животных */}
      <section className="mb-5 container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white bg-dark py-2 px-4 rounded">Последние объявления</h2>
          <Button variant="outline-dark" onClick={loadData}>
            Обновить
          </Button>
        </div>
        
        <Row className="g-4" id="homePetsContainer">
          {homeAds.length > 0 ? (
            homeAds.map(pet => (
              <Col key={pet.id} md={6} lg={4}>
                <PetCard pet={pet} onShowDetails={() => showPetDetails(pet)} />
              </Col>
            ))
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
              
              <Button type="submit" variant="dark" className="w-100">
                Подписаться
              </Button>
            </Form>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default Home;