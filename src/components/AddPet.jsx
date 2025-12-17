import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'https://pets.сделай.site';

function AddPet({ showNotification }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    digit: false
  });
  const [agreement, setAgreement] = useState(false);
  const [register, setRegister] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    kind: '',
    district: '',
    mark: '',
    description: '',
    photo1: null,
    photo2: null,
    photo3: null,
    confirm: 0
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const cleanName = user.name ? user.name.replace(/[^А-Яа-яЁё\s-]/g, '') : '';
      
      setFormData(prev => ({
        ...prev,
        name: cleanName || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
      
      setRegister(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (password) {
      const newRequirements = {
        length: password.length >= 7,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        digit: /\d/.test(password)
      };
      setPasswordRequirements(newRequirements);
    }
  }, [password]);

  const validateName = (name, isAutoFilled = false) => {
    if (!name.trim()) return false;
    if (isAutoFilled) return true;
    return /^[А-Яа-яЁё\s-]+$/.test(name);
  };

  const validatePhone = (phone) => /^\+?[0-9\s\-()]+$/.test(phone);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(pwd);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e, photoNumber) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.png')) {
        setErrors(prev => ({
          ...prev,
          [`photo${photoNumber}`]: 'Фото должно быть в формате PNG'
        }));
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [`photo${photoNumber}`]: file
      }));
      
      if (errors[`photo${photoNumber}`]) {
        setErrors(prev => ({ ...prev, [`photo${photoNumber}`]: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Введите ваше имя';
    } else if (!validateName(formData.name, isAuthenticated)) {
      if (isAuthenticated) {
        newErrors.name = 'Имя содержит некириллические символы. Рекомендуется исправить.';
      } else {
        newErrors.name = 'Имя должно содержать только кириллицу, пробелы и дефисы';
      }
    }
    
    if (!formData.phone.trim()) newErrors.phone = 'Введите номер телефона';
    else if (!validatePhone(formData.phone)) newErrors.phone = 'Телефон должен содержать только цифры и знак +';
    
    if (!formData.email.trim()) newErrors.email = 'Введите email';
    else if (!validateEmail(formData.email)) newErrors.email = 'Введите корректный email адрес';
    
    if (!formData.kind.trim()) newErrors.kind = 'Введите вид животного';
    
    if (!formData.district) newErrors.district = 'Выберите район';
    
    if (!formData.description.trim()) newErrors.description = 'Введите описание';
    else if (formData.description.length < 10 || formData.description.length > 1000) {
      newErrors.description = 'Описание должно содержать от 10 до 1000 символов';
    }
    
    if (!formData.photo1) newErrors.photo1 = 'Загрузите основное фото';
    
    if (formData.mark.trim() && !/^[A-Za-z0-9-]+$/.test(formData.mark)) {
      newErrors.mark = 'Номер чипа может содержать только латинские буквы, цифры и дефисы';
    }
    
    if (register) {
      if (!password) {
        newErrors.password = 'Введите пароль';
      } else if (!validatePassword(password)) {
        newErrors.password = 'Пароль должен содержать минимум 7 символов, включая 1 цифру, 1 строчную и 1 заглавную букву';
      }
      
      if (!passwordConfirmation) {
        newErrors.password_confirmation = 'Подтвердите пароль';
      } else if (password !== passwordConfirmation) {
        newErrors.password_confirmation = 'Пароли не совпадают';
      }
    }
    
    if (!agreement) newErrors.confirm = 'Необходимо согласие на обработку персональных данных';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const registerUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          password: userData.password,
          password_confirmation: userData.password_confirmation,
          confirm: 1
        }),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        return { success: true };
      } else {
        // Извлекаем детальные ошибки валидации
        let errorMessage = 'Ошибка регистрации';
        
        if (responseData.error?.errors) {
          const serverErrors = responseData.error.errors;
          // Берем первую ошибку из всех полей
          for (const field in serverErrors) {
            if (serverErrors[field] && serverErrors[field][0]) {
              errorMessage = serverErrors[field][0];
              break;
            }
          }
        } else if (responseData.error?.message) {
          errorMessage = responseData.error.message;
        }
        
        return {
          success: false,
          error: errorMessage,
          errors: responseData.error?.errors || {}
        };
      }
    } catch (error) {
      console.error('Ошибка при регистрации пользователя:', error);
      return { success: false, error: 'Сетевая ошибка' };
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          token: data.token || data.data?.token,
          userData: data.data || data
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'Ошибка входа'
        };
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return { success: false, error: 'Сетевая ошибка' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!validateForm()) {
      if (showNotification) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'danger');
      } else {
        alert('Пожалуйста, исправьте ошибки в форме');
      }
      setIsSubmitting(false);
      return;
    }
    
    try {
      let userToken = null;
      let isNewRegistration = false;
      
      if (register) {
        if (!isAuthenticated) {
          const registrationResult = await registerUser({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            password: password,
            password_confirmation: passwordConfirmation
          });
          
          if (!registrationResult.success) {
            // Если email уже занят, пробуем войти
            if (registrationResult.error.includes('email has already been taken') || 
                registrationResult.error.includes('email уже занят')) {
              
              const loginResult = await loginUser(formData.email, password);
              
              if (loginResult.success) {
                userToken = loginResult.token;
                login({
                  email: formData.email,
                  name: formData.name,
                  phone: formData.phone,
                  id: loginResult.userData?.id
                }, userToken);
              } else {
                if (showNotification) {
                  showNotification('Аккаунт с этим email уже существует. Введите правильный пароль.', 'danger');
                } else {
                  alert('Аккаунт с этим email уже существует. Введите правильный пароль.');
                }
                setErrors({ password: 'Введите правильный пароль для этого аккаунта' });
                setIsSubmitting(false);
                return;
              }
            } else {
              if (showNotification) {
                showNotification(`Ошибка регистрации: ${registrationResult.error}`, 'danger');
              } else {
                alert(`Ошибка регистрации: ${registrationResult.error}`);
              }
              setIsSubmitting(false);
              return;
            }
          } else {
            const loginResult = await loginUser(formData.email, password);
            
            if (loginResult.success) {
              userToken = loginResult.token;
              login({
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                id: loginResult.userData?.id
              }, userToken);
              
              isNewRegistration = true;
            } else {
              if (showNotification) {
                showNotification(`Регистрация прошла, но вход не удался: ${loginResult.error}`, 'warning');
              } else {
                alert(`Регистрация прошла, но вход не удался: ${loginResult.error}`);
              }
              setIsSubmitting(false);
              return;
            }
          }
        } else {
          const loginResult = await loginUser(formData.email, password);
          
          if (loginResult.success) {
            userToken = user.token;
          } else {
            if (showNotification) {
              showNotification('Неверный пароль', 'danger');
            } else {
              alert('Неверный пароль');
            }
            setErrors({ password: 'Неверный пароль' });
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('phone', formData.phone);
      submitData.append('email', formData.email);
      submitData.append('kind', formData.kind);
      submitData.append('district', formData.district);
      submitData.append('mark', formData.mark || '');
      submitData.append('description', formData.description);
      submitData.append('confirm', agreement ? 1 : 0);
      submitData.append('register', register ? 1 : 0);
      
      if (formData.photo1) submitData.append('photo1', formData.photo1);
      if (formData.photo2) submitData.append('photo2', formData.photo2);
      if (formData.photo3) submitData.append('photo3', formData.photo3);
      
      if (register) {
        submitData.append('password', password);
        submitData.append('password_confirmation', passwordConfirmation || password);
      }
      
      const headers = {};
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/pets`, {
        method: 'POST',
        headers: headers,
        body: submitData,
      });
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError);
        if (showNotification) {
          showNotification('Сервер вернул некорректный ответ', 'danger');
        } else {
          alert('Сервер вернул некорректный ответ');
        }
        setIsSubmitting(false);
        return;
      }
      
      if (response.ok) {
        let petId = null;
        
        if (data.data && data.data.status === 'ok' && data.data.id) {
          petId = data.data.id;
        } else if (data.status === 'ok' && data.id) {
          petId = data.id;
        } else if (data.data && data.data.id) {
          petId = data.data.id;
        } else if (data.id) {
          petId = data.id;
        }
        
        if (petId) {
          if (register) {
            if (isNewRegistration) {
              if (showNotification) {
                showNotification('Аккаунт создан и объявление успешно добавлено!', 'success');
              } else {
                alert('Аккаунт создан и объявление успешно добавлено!');
              }
              
              navigate(`/profile`);
            } else {
              if (showNotification) {
                showNotification('Объявление успешно добавлено и привязано к вашему аккаунту!', 'success');
              } else {
                alert('Объявление успешно добавлено и привязано к вашему аккаунту!');
              }
              
              navigate(`/profile`);
            }
          } else {
            if (showNotification) {
              showNotification('Анонимное объявление успешно добавлено!', 'success');
            } else {
              alert('Анонимное объявление успешно добавлено!');
            }
            navigate('/');
          }
        } else {
          if (showNotification) {
            showNotification('Объявление успешно добавлено!', 'success');
          } else {
            alert('Объявление успешно добавлено!');
          }
          navigate('/');
        }
        
      } else {
        if (response.status === 422 && data.error?.errors) {
          const serverErrors = data.error.errors;
          const formattedErrors = {};
          
          Object.keys(serverErrors).forEach(key => {
            if (Array.isArray(serverErrors[key])) {
              formattedErrors[key] = serverErrors[key].join(', ');
            } else {
              formattedErrors[key] = serverErrors[key];
            }
          });
          
          setErrors(formattedErrors);
          if (showNotification) {
            showNotification('Ошибка валидации: проверьте введенные данные', 'danger');
          } else {
            alert('Ошибка валидации: проверьте введенные данные');
          }
        } else {
          const errorMsg = data.error?.message || data.message || `Ошибка сервера: ${response.status}`;
          if (showNotification) {
            showNotification(errorMsg, 'danger');
          } else {
            alert(errorMsg);
          }
        }
      }
      
    } catch (error) {
      console.error('Ошибка при добавлении объявления:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        if (showNotification) {
          showNotification('Не удалось подключиться к серверу. Проверьте интернет-соединение и попробуйте снова.', 'danger');
        } else {
          alert('Не удалось подключиться к серверу. Проверьте интернет-соединение и попробуйте снова.');
        }
      } else {
        if (showNotification) {
          showNotification('Произошла ошибка при добавлении объявления', 'danger');
        } else {
          alert('Произошла ошибка при добавлении объявления');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const districts = [
    "Адмиралтейский", "Василеостровский", "Выборгский", "Калининский",
    "Кировский", "Колпинский", "Красногвардейский", "Красносельский",
    "Кронштадтский", "Курортный", "Московский", "Невский",
    "Петроградский", "Петродворцовый", "Приморский", "Пушкинский",
    "Фрунзенский", "Центральный"
  ];

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <h2 className="card-title text-center mb-4">Добавить информацию о найденном животном</h2>
              
              <Alert variant="info" className="mb-4">
                <strong>Внимание!</strong> Вы можете добавить объявление анонимно или привязать его к аккаунту.
                Привязанные объявления будут отображаться в вашем личном кабинете.
              </Alert>
              
              {Object.keys(errors).length > 0 && (
                <Alert variant="warning" className="mb-3">
                  <strong>Ошибки в форме:</strong>
                  <ul className="mb-0 mt-2">
                    {Object.entries(errors).map(([field, error], index) => (
                      <li key={index}><strong>{field}:</strong> {error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit} encType="multipart/form-data">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label htmlFor="name" className="required-field">
                      Ваше имя
                    </Form.Label>
                    <Form.Control
                      type="text"
                      className={errors.name ? 'is-invalid' : ''}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      readOnly={isAuthenticated}
                    />
                    {errors.name && (
                      <Form.Control.Feedback type="invalid" className={isAuthenticated ? 'text-warning' : ''}>
                        {errors.name}
                      </Form.Control.Feedback>
                    )}
                    <Form.Text className="text-muted">
                      Имя должно содержать только кириллицу, пробелы и дефисы
                    </Form.Text>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Label htmlFor="phone" className="required-field">
                      Телефон
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      className={errors.phone ? 'is-invalid' : ''}
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      readOnly={isAuthenticated}
                    />
                    {errors.phone && <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>}
                    <Form.Text className="text-muted">Телефон должен содержать только цифры и знак +</Form.Text>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="email" className="required-field">
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    className={errors.email ? 'is-invalid' : ''}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    readOnly={isAuthenticated}
                  />
                  {errors.email && <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    className={errors.register ? 'is-invalid' : ''}
                    id="register"
                    name="register"
                    checked={register}
                    onChange={(e) => setRegister(e.target.checked)}
                    label="Хочу привязать объявление к аккаунту / зарегистрироваться"
                  />
                  <Form.Text className="text-muted">
                    {register 
                      ? 'Объявление будет отображаться в вашем личном кабинете'
                      : 'Объявление будет анонимным и не будет привязано к аккаунту'
                    }
                  </Form.Text>
                </Form.Group>
                
                {register && (
                  <Row className="mb-3">
                    <Col md={6} className="mb-3">
                      <Form.Label htmlFor="password" className="required-field">
                        {isAuthenticated ? 'Пароль для подтверждения' : 'Пароль для аккаунта'}
                      </Form.Label>
                      <Form.Control
                        type="password"
                        className={errors.password ? 'is-invalid' : ''}
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={register}
                        placeholder={isAuthenticated ? "Введите пароль от вашего аккаунта" : "Придумайте пароль"}
                      />
                      {errors.password && <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>}
                      
                      {!isAuthenticated && (
                        <div className="password-requirements mt-2">
                          <div className={`requirement ${passwordRequirements.length ? 'text-success' : 'text-danger'}`}>
                            <span> Минимум 7 символов</span>
                          </div>
                          <div className={`requirement ${passwordRequirements.lowercase ? 'text-success' : 'text-danger'}`}>
                            <span> Одна строчная буква (a-z)</span>
                          </div>
                          <div className={`requirement ${passwordRequirements.uppercase ? 'text-success' : 'text-danger'}`}>
                            <span> Одна заглавная буква (A-Z)</span>
                          </div>
                          <div className={`requirement ${passwordRequirements.digit ? 'text-success' : 'text-danger'}`}>
                            <span> Одна цифра (0-9)</span>
                          </div>
                        </div>
                      )}
                    </Col>
                    
                    <Col md={6} className="mb-3">
                      <Form.Label htmlFor="password_confirmation" className="required-field">
                        Подтверждение пароля
                      </Form.Label>
                      <Form.Control
                        type="password"
                        className={errors.password_confirmation ? 'is-invalid' : ''}
                        id="password_confirmation"
                        name="password_confirmation"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        required={register}
                        placeholder="Повторите пароль"
                      />
                      {errors.password_confirmation && <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>}
                    </Col>
                  </Row>
                )}
                
                {isAuthenticated && register && (
                  <Alert variant="success" className="mb-3">
                    Вы авторизованы как <strong>{user.name || user.email}</strong>.
                    Объявление будет привязано к вашему аккаунту.
                  </Alert>
                )}
                
                {!register && (
                  <Alert variant="warning" className="mb-3">
                    Объявление будет анонимным и не будет отображаться в личном кабинете.
                  </Alert>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="kind" className="required-field">
                    Вид животного
                  </Form.Label>
                  <Form.Control
                    type="text"
                    className={errors.kind ? 'is-invalid' : ''}
                    id="kind"
                    name="kind"
                    value={formData.kind}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.kind && <Form.Control.Feedback type="invalid">{errors.kind}</Form.Control.Feedback>}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="district" className="required-field">
                    Район, где найдено животное
                  </Form.Label>
                  <Form.Select
                    className={errors.district ? 'is-invalid' : ''}
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите район</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </Form.Select>
                  {errors.district && <Form.Control.Feedback type="invalid">{errors.district}</Form.Control.Feedback>}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="mark">Номер чипа/клеймо</Form.Label>
                  <Form.Control
                    type="text"
                    className={errors.mark ? 'is-invalid' : ''}
                    id="mark"
                    name="mark"
                    value={formData.mark}
                    onChange={handleInputChange}
                    placeholder="Например: VL-0214"
                  />
                  {errors.mark && <Form.Control.Feedback type="invalid">{errors.mark}</Form.Control.Feedback>}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="description" className="required-field">
                    Описание
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    className={errors.description ? 'is-invalid' : ''}
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.description && <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>}
                  <Form.Text className="text-muted">Минимум 10 символов, максимум 1000 символов</Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="required-field">
                    Фотографии животного
                  </Form.Label>
                  <Alert variant="info" className="mb-2">
                    <small>Все фотографии должны быть в формате PNG</small>
                  </Alert>
                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Label htmlFor="photo1" className="required-field">
                        Фото 1
                      </Form.Label>
                      <Form.Control
                        type="file"
                        className={errors.photo1 ? 'is-invalid' : ''}
                        id="photo1"
                        name="photo1"
                        accept=".png"
                        onChange={(e) => handleFileChange(e, 1)}
                        required
                      />
                      {errors.photo1 && <Form.Control.Feedback type="invalid">{errors.photo1}</Form.Control.Feedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label htmlFor="photo2">Фото 2</Form.Label>
                      <Form.Control
                        type="file"
                        className={errors.photo2 ? 'is-invalid' : ''}
                        id="photo2"
                        name="photo2"
                        accept=".png"
                        onChange={(e) => handleFileChange(e, 2)}
                      />
                      {errors.photo2 && <Form.Control.Feedback type="invalid">{errors.photo2}</Form.Control.Feedback>}
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label htmlFor="photo3">Фото 3</Form.Label>
                      <Form.Control
                        type="file"
                        className={errors.photo3 ? 'is-invalid' : ''}
                        id="photo3"
                        name="photo3"
                        accept=".png"
                        onChange={(e) => handleFileChange(e, 3)}
                      />
                      {errors.photo3 && <Form.Control.Feedback type="invalid">{errors.photo3}</Form.Control.Feedback>}
                    </Col>
                  </Row>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    className={errors.confirm ? 'is-invalid' : ''}
                    id="confirm"
                    name="confirm"
                    checked={agreement}
                    onChange={(e) => setAgreement(e.target.checked)}
                    required
                    label="Я согласен на обработку персональных данных"
                  />
                  {errors.confirm && <Form.Control.Feedback type="invalid">{errors.confirm}</Form.Control.Feedback>}
                </Form.Group>
                
                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Отправка...
                      </>
                    ) : register ? 'Добавить объявление и привязать к аккаунту' : 'Добавить анонимное объявление'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AddPet;