import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/helpers';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Загружаем сохраненные данные при монтировании
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('userName');
    const savedPhone = localStorage.getItem('userPhone');
    
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    console.log('=== LOGIN FORM SUBMIT ===');
    
    // Валидация
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Поле обязательно для заполнения';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Поле обязательно для заполнения';
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      setErrors({});
      
      // Получаем сохраненные данные для передачи в login
      const savedName = localStorage.getItem('userName') || '';
      const savedPhone = localStorage.getItem('userPhone') || '';
      
      const credentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: savedName,
        phone: savedPhone
      };

      console.log('Attempting login with:', { ...credentials, password: '***' });
      
      await login(credentials);
      console.log('Login successful, navigating to profile');
      
      // Если стоит флаг "запомнить меня", сохраняем данные
      if (formData.rememberMe) {
        localStorage.setItem('userEmail', credentials.email);
        localStorage.setItem('userName', credentials.name);
        localStorage.setItem('userPhone', credentials.phone);
      }
      
      // Перенаправляем в личный кабинет
      navigate('/profile', { replace: true });
      
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', error);
      
      let errorMessage = error.message || 'Ошибка при входе';
      
      // Улучшаем сообщения об ошибках по ТЗ
      if (error.status === 401) {
        errorMessage = 'Неверный email или пароль';
        setErrors({
          email: 'Неверный email или пароль',
          password: 'Неверный email или пароль'
        });
      } else if (error.status === 422) {
        errorMessage = 'Неверный email или пароль';
        setErrors({
          email: 'Неверный email или пароль',
          password: 'Неверный email или пароль'
        });
      } else if (errorMessage.includes('Invalid credentials') || 
          errorMessage.includes('Unauthorized')) {
        errorMessage = 'Неверный email или пароль';
        setErrors({
          email: 'Неверный email или пароль',
          password: 'Неверный email или пароль'
        });
      } else if (errorMessage.includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('password')) {
        setErrors({ password: errorMessage });
      } else if (errorMessage.includes('Токен не получен')) {
        // Обработка ошибки отсутствия токена
        errorMessage = 'Ошибка аутентификации. Попробуйте еще раз.';
        setApiError(errorMessage);
      } else {
        // Общая ошибка
        setApiError(errorMessage);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Автозаполнение для тестовых данных
  const fillTestData = () => {
    setFormData({
      email: 'user@user.ru',
      password: 'paSSword1',
      rememberMe: false
    });
    setErrors({});
    setApiError('');
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

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    label="Запомнить меня"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={loading}
                  />
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
                  onClick={fillTestData}
                  disabled={loading}
                >
                  Заполнить тестовые данные
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <div className="mt-4 text-center">
            <p className="text-muted small">
              <strong>Тестовые данные из ТЗ:</strong><br/>
              Email: user@user.ru<br/>
              Пароль: paSSword1<br/>
              <br/>
              <strong>После входа:</strong><br/>
              Вы попадете в личный кабинет, где сможете:<br/>
              1. Управлять своими данными<br/>
              2. Добавлять и редактировать объявления<br/>
              3. Просматривать историю действий
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;