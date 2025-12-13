import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhone, validateName } from '../utils/helpers';

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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Очищаем ошибку для этого поля при изменении
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Очищаем общую ошибку при любом изменении
    if (apiError) {
      setApiError('');
    }
    if (success) {
      setSuccess('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Валидация имени
    if (!formData.name.trim()) {
      newErrors.name = 'Поле обязательно для заполнения';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Допустимы только кириллица, пробел и дефис';
    }

    // Валидация телефона
    if (!formData.phone.trim()) {
      newErrors.phone = 'Поле обязательно для заполнения';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Допустимы только цифры и знак +';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Телефон должен содержать минимум 10 цифр';
    }

    // Валидация email
    if (!formData.email.trim()) {
      newErrors.email = 'Поле обязательно для заполнения';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }

    // Валидация пароля
    if (!formData.password) {
      newErrors.password = 'Поле обязательно для заполнения';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну цифру';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну строчную букву';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну заглавную букву';
    }

    // Валидация подтверждения пароля
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Поле обязательно для заполнения';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Пароли не совпадают';
    }

    // Валидация согласия
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'Необходимо согласие на обработку персональных данных';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== REGISTRATION FORM SUBMIT ===');
    
    // Валидация формы
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
      setErrors(newErrors);
      setApiError('Пожалуйста, исправьте ошибки в форме.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      setSuccess('');
      setErrors({});
      
      // Форматируем телефон согласно ТЗ (только цифры и +)
      let formattedPhone = formData.phone.replace(/[^\d+]/g, '');
      
      // Убедимся, что телефон начинается с +7
      if (formattedPhone.startsWith('8')) {
        formattedPhone = '7' + formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('7')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+7' + formattedPhone;
        }
      }
      
      // Подготавливаем данные для отправки
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        confirm: formData.agreeToTerms ? 1 : 0
      };

      console.log('Sending registration data:', { ...userData, password: '***', password_confirmation: '***' });
      
      // Регистрация
      await register(userData);
      console.log('Registration successful');
      
      // Показываем сообщение об успехе
      setSuccess('Регистрация прошла успешно! Вы автоматически вошли в систему.');
      
      // Через 2 секунды перенаправляем на главную
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      
    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error:', error);
      
      let errorMessage = error.message || 'Ошибка при регистрации';
      
      // Определяем поле для ошибки на основе сообщения
      const newFieldErrors = {};
      
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        newFieldErrors.email = errorMessage;
      } else if (errorMessage.includes('phone') || errorMessage.includes('Телефон')) {
        newFieldErrors.phone = errorMessage;
      } else if (errorMessage.includes('password') || errorMessage.includes('Пароль')) {
        newFieldErrors.password = errorMessage;
      } else if (errorMessage.includes('name') || errorMessage.includes('Имя')) {
        newFieldErrors.name = errorMessage;
      } else if (errorMessage.includes('agree') || errorMessage.includes('согласие')) {
        newFieldErrors.agreeToTerms = errorMessage;
      }
      
      // Устанавливаем ошибки полей
      if (Object.keys(newFieldErrors).length > 0) {
        setErrors(newFieldErrors);
      }
      
      // Устанавливаем общую ошибку
      setApiError(errorMessage);
      
      // Прокручиваем к ошибке
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <h2 className="card-title text-center mb-4">Регистрация</h2>
              
              {apiError && (
                <Alert variant="danger" className="mb-3">
                  <Alert.Heading>Ошибка регистрации</Alert.Heading>
                  <p className="mb-0">{apiError}</p>
                </Alert>
              )}
              
              {success && (
                <Alert variant="success" className="mb-3">
                  <Alert.Heading>Успешно!</Alert.Heading>
                  <p className="mb-0">{success}</p>
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
                    placeholder="Иван Иванов"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Только кириллица, пробелы и дефис
                  </Form.Text>
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
                    placeholder="+7 (900) 123-45-67"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Пример: +7 (911) 123-45-67
                  </Form.Text>
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
                  <Form.Text className="text-muted">
                    Этот email будет использоваться для входа
                  </Form.Text>
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
                    placeholder="Минимум 8 символов"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Минимум 8 символов: цифры, строчные и заглавные буквы
                  </Form.Text>
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

                <Form.Group className="mb-4">
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
                  className="w-100 py-2 mb-3" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Регистрация...
                    </>
                  ) : 'Зарегистрироваться'}
                </Button>

                <div className="text-center">
                  <p className="mb-0">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="text-decoration-none">
                      Войти
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          <div className="mt-4 text-center">
            <p className="text-muted small">
              <strong>Тестовые данные для регистрации:</strong><br/>
              Имя: Иван Иванов<br/>
              Телефон: +7 (900) 123-45-67<br/>
              Email: test{Date.now().toString().slice(-6)}@example.com<br/>
              Пароль: Test1234 (минимум 8 символов, цифры и буквы)
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Registration;