import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhone, validateName, validatePassword } from '../utils/helpers';

const Registration = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Поле обязательно для заполнения';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Допустимы только кириллица, пробел и дефис';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Поле обязательно для заполнения';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Допустимы только цифры и знак +';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Поле обязательно для заполнения';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    if (!formData.password) {
      newErrors.password = 'Поле обязательно для заполнения';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Пароль должен содержать минимум 7 символов, включая 1 цифру, 1 строчную и 1 заглавную букву';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Поле обязательно для заполнения';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Пароли не совпадают';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо согласие на обработку персональных данных';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        confirm: formData.agreeToTerms ? 1 : 0
      };

      console.log('Attempting registration with:', userData);
      await register(userData);
      navigate('/');
      
    } catch (error) {
      console.error('Registration error:', error);
      // Преобразуем ошибку в строку
      const errorMessage = error.message || error.toString();
      setApiError(errorMessage || 'Ошибка при регистрации. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <h2 className="card-title text-center mb-4">Регистрация</h2>
              
              {apiError && (
                <Alert variant="danger" className="mb-3">
                  {typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="required-field">Имя</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                    disabled={loading}
                    placeholder="Введите ваше имя"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="required-field">Телефон</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    isInvalid={!!errors.phone}
                    disabled={loading}
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="required-field">Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    disabled={loading}
                    placeholder="example@mail.ru"
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
                    placeholder="Минимум 7 символов"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="required-field">Подтверждение пароля</Form.Label>
                  <Form.Control
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    isInvalid={!!errors.password_confirmation}
                    disabled={loading}
                    placeholder="Повторите пароль"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password_confirmation}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="regConfirm"
                    name="agreeToTerms"
                    label="Я согласен с условиями использования и обработкой персональных данных"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    isInvalid={!!errors.agreeToTerms}
                    className="required-field"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.agreeToTerms}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Регистрация...
                    </>
                  ) : 'Зарегистрироваться'}
                </Button>

                <div className="mt-3 text-center">
                  <p>
                    Уже есть аккаунт?{' '}
                    <Link to="/login">Войти</Link>
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

export default Registration;