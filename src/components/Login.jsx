import React, { useState } from 'react';
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setApiError('');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      
      const credentials = {
        email: formData.email,
        password: formData.password,
      };

      console.log('Attempting login with:', credentials);
      await login(credentials);
      navigate('/');
      
    } catch (error) {
      console.error('Login error:', error);
      // Преобразуем ошибку в строку
      const errorMessage = error.message || error.toString();
      setApiError(errorMessage || 'Ошибка при входе. Проверьте email и пароль.');
    } finally {
      setLoading(false);
    }
  };
  const handleTestLogin = () => {
    setFormData({
      email: 'test@example.com', // Замените на реальный тестовый email
      password: 'Password123', // Замените на реальный тестовый пароль
      rememberMe: false
    });
  };
  
  // Внутри рендера, перед кнопкой входа добавьте:
  <Button 
    variant="outline-secondary" 
    className="w-100 mb-3" 
    onClick={handleTestLogin}
    disabled={loading}
  >
    Использовать тестовые данные
  </Button>
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <h2 className="card-title text-center mb-4">Вход в систему</h2>
              
              {apiError && (
                <Alert variant="danger" className="mb-3">
                  {typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
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
                  className="w-100 mb-3" 
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
                  <p>
                    Нет аккаунта?{' '}
                    <Link to="/registration">Зарегистрироваться</Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;