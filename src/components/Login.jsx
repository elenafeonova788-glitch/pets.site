import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибки при изменении
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Поле обязательно для заполнения';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Поле обязательно для заполнения';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      setErrors({});
      
      // Входим через AuthContext
      const credentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };
      
      // Используем функцию login из AuthContext
      const response = await fetch('https://pets.сделай.site/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.token && !data.data?.token) {
          throw new Error('Токен не получен от сервера');
        }
        
        const token = data.token || data.data?.token;
        
        // Получаем данные пользователя
        const userResponse = await fetch('https://pets.сделай.site/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        let userData = null;
        if (userResponse.ok) {
          const userInfo = await userResponse.json();
          
          if (userInfo.data?.user?.[0]) {
            userData = userInfo.data.user[0];
          } else if (userInfo.data) {
            userData = userInfo.data;
          } else if (userInfo) {
            userData = userInfo;
          }
        }
        
        const user = {
          email: userData?.email || credentials.email,
          token: token,
          name: userData?.name || credentials.email.split('@')[0],
          phone: userData?.phone || '',
          id: userData?.id
        };
        
        // Вызываем login из контекста
        login(user, token);
        
        // Перенаправляем в личный кабинет
        navigate('/profile');
        
      } else if (response.status === 401 || response.status === 422) {
        setApiError('Неверный email или пароль');
        setErrors({
          email: 'Неверный email или пароль',
          password: 'Неверный email или пароль'
        });
      } else {
        const errorData = await response.json();
        setApiError(errorData.error?.message || 'Ошибка при входе');
      }
      
    } catch (error) {
      console.error('Ошибка входа:', error);
      setApiError(error.message || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="card-title text-center mb-4">Вход в систему</h2>
              
              {apiError && (
                <Alert variant="danger" className="mb-3">
                  <Alert.Heading>Ошибка входа</Alert.Heading>
                  <p className="mb-0">{apiError}</p>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="required-field">Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    disabled={loading}
                    placeholder="Введите email"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="required-field">Пароль</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    disabled={loading}
                    placeholder="Введите пароль"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 py-2 mb-3" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Вход...
                    </>
                  ) : 'Войти'}
                </Button>

                <div className="text-center">
                  <p className="mb-0">
                    Нет аккаунта?{' '}
                    <Link to="/registration" className="text-decoration-none">
                      Зарегистрироваться
                    </Link>
                  </p>
                </div>
              </Form>
              
              <div className="text-center mt-3">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => {
                    setFormData({
                      email: 'user@user.ru',
                      password: 'paSSword1',
                    });
                    setErrors({});
                    setApiError('');
                  }}
                  disabled={loading}
                >
                  Заполнить тестовые данные
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;