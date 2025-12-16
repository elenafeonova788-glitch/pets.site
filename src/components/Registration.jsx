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
    
    if (apiError) {
      setApiError('');
    }
    if (success) {
      setSuccess('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Валидация имени - кириллица, пробел, дефис
    if (!formData.name.trim()) {
      newErrors.name = 'Поле обязательно для заполнения';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Допустимы только кириллица, пробел и дефис';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Имя слишком длинное (максимум 50 символов)';
    }

    // Валидация телефона - только цифры и знак +
    if (!formData.phone.trim()) {
      newErrors.phone = 'Поле обязательно для заполнения';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Допустимы только цифры и знак +';
    } else {
      // Проверка минимальной и максимальной длины телефона
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        newErrors.phone = 'Телефон должен содержать минимум 10 цифр';
      } else if (phoneDigits.length > 15) {
        newErrors.phone = 'Телефон слишком длинный (максимум 15 цифр)';
      }
    }

    // Валидация email
    if (!formData.email.trim()) {
      newErrors.email = 'Поле обязательно для заполнения';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес (максимум 254 символа, локальная часть до 64 символов)';
    } else if (formData.email.length > 254) {
      newErrors.email = 'Email слишком длинный (максимум 254 символа)';
    }

    // Валидация пароля - минимум 7 символов: 1 цифра, 1 строчная, 1 заглавная
    if (!formData.password) {
      newErrors.password = 'Поле обязательно для заполнения';
    } else if (formData.password.length < 7) {
      newErrors.password = 'Пароль должен содержать минимум 7 символов';
    } else if (formData.password.length > 100) {
      newErrors.password = 'Пароль слишком длинный (максимум 100 символов)';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну цифру, одну строчную и одну заглавную букву';
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
      
      // Форматируем телефон: оставляем только цифры
      let formattedPhone = formData.phone.replace(/\D/g, '');
      
      // Подготавливаем данные для отправки
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        confirm: formData.agreeToTerms ? 1 : 0,
      };

      console.log('Sending ALL user data to register:', { 
        ...userData, 
        password: '***', 
        password_confirmation: '***' 
      });
      
      // Регистрация
      const result = await register(userData);
      console.log('Registration result:', result);
      
      if (result.success) {
        setSuccess(result.message || 'Регистрация прошла успешно!');
        
        // Если есть сообщение об успешном входе, перенаправляем
        if (result.message && result.message.includes('вошли в систему')) {
          setTimeout(() => {
            navigate('/profile', { replace: true });
          }, 2000);
        } else {
          // Иначе предлагаем войти
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      }
      
    } catch (error) {
      console.error('=== REGISTRATION ERROR IN COMPONENT ===');
      console.error('Error:', error);
      
      let errorMessage = error.message || 'Ошибка при регистрации';
      
      // Упрощаем обработку ошибок
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('phone') || errorMessage.includes('Телефон')) {
        setErrors({ phone: errorMessage });
      } else if (errorMessage.includes('password') || errorMessage.includes('Пароль')) {
        setErrors({ password: errorMessage });
      } else if (errorMessage.includes('name') || errorMessage.includes('Имя')) {
        setErrors({ name: errorMessage });
      } else if (errorMessage.includes('agree') || errorMessage.includes('согласие') || errorMessage.includes('confirm')) {
        setErrors({ agreeToTerms: errorMessage });
      } else {
        // Общая ошибка
        setApiError(errorMessage);
      }
      
      // Прокручиваем к ошибке
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // Функция для заполнения тестовых данных
  const fillTestData = () => {
    // Генерируем случайные тестовые данные
    const randomNum = Math.floor(Math.random() * 1000);
    setFormData({
      name: 'Тест Пользователь',
      phone: `8900${1000000 + randomNum}`,
      email: `test${randomNum}@example.com`,
      password: 'Test1234',
      password_confirmation: 'Test1234',
      agreeToTerms: true
    });
    setErrors({});
    setApiError('');
    setSuccess('');
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
                    Только кириллица, пробелы и дефис (максимум 50 символов)
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
                    placeholder="89001234567"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Пример: 89001234567 или +79001234567 (10-15 цифр)
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
                    placeholder="user@user.ru"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Этот email будет использоваться для входа (максимум 254 символа)
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
                    placeholder="Минимум 7 символов"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Минимум 7 символов: хотя бы 1 цифра, 1 строчная и 1 заглавная буква (максимум 100 символов)
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
              <strong>Пример данных для регистрации:</strong><br/>
              Имя: Тест Пользователь (кириллица, максимум 50 символов)<br/>
              Телефон: 89001234567 (10-15 цифр)<br/>
              Email: любой валидный email (максимум 254 символа)<br/>
              Пароль: Test1234 (7-100 символов, 1 цифра, 1 строчная, 1 заглавная)<br/>
              Подтверждение пароля: Test1234 (должно совпадать)<br/>
              Согласие: обязательно
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Registration;