import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';

const EditPetModal = ({ pet, token, onClose, onSuccess, showNotification }) => {
  const [formData, setFormData] = useState({
    description: pet.description || '',
    mark: pet.mark || ''
  });
  
  const [photos, setPhotos] = useState({
    photo1: null,
    photo2: null,
    photo3: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleFileChange = (e, photoNumber) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка формата PNG
      if (!file.name.toLowerCase().endsWith('.png')) {
        setErrors(prev => ({
          ...prev,
          [`photo${photoNumber}`]: 'Фото должно быть в формате PNG'
        }));
        return;
      }
      
      setPhotos(prev => ({
        ...prev,
        [`photo${photoNumber}`]: file
      }));
      
      if (errors[`photo${photoNumber}`]) {
        setErrors(prev => ({ ...prev, [`photo${photoNumber}`]: '' }));
      }
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Введите описание';
    } else if (formData.description.length < 10 || formData.description.length > 1000) {
      newErrors.description = 'Описание должно содержать от 10 до 1000 символов';
    }
    
    // Проверка номера чипа если заполнен
    if (formData.mark.trim() && !/^[A-Za-z0-9\-]+$/.test(formData.mark)) {
      newErrors.mark = 'Номер чипа может содержать только латинские буквы, цифры и дефисы';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) {
      if (showNotification) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'danger');
      } else {
        alert('Пожалуйста, исправьте ошибки в форме');
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      
      // Добавляем текстовые поля
      submitData.append('description', formData.description);
      if (formData.mark.trim()) {
        submitData.append('mark', formData.mark);
      }
      
      // Добавляем фото если есть новые
      if (photos.photo1) submitData.append('photo1', photos.photo1);
      if (photos.photo2) submitData.append('photo2', photos.photo2);
      if (photos.photo3) submitData.append('photo3', photos.photo3);
      
      const response = await fetch(`https://pets.сделай.site/api/pets/${pet.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData,
      });
      
      // Читаем ответ как текст для отладки
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Если не JSON, но статус 200, считаем успехом
        if (response.ok) {
          onSuccess();
          return;
        } else {
          throw new Error(`Некорректный ответ сервера: ${responseText}`);
        }
      }
      
      if (response.ok) {
        onSuccess();
      } else if (response.status === 401) {
        setServerError('Сессия истекла. Войдите снова.');
        if (showNotification) {
          showNotification('Сессия истекла. Войдите снова.', 'warning');
        }
        setTimeout(() => onClose(), 2000);
      } else if (response.status === 403) {
        setServerError('Недостаточно прав для редактирования этого объявления');
        if (showNotification) {
          showNotification('Недостаточно прав для редактирования этого объявления', 'danger');
        }
      } else if (response.status === 422) {
        const errorMsg = data.error?.message || data.message || 'Ошибка валидации';
        setServerError(errorMsg);
        if (showNotification) {
          showNotification(errorMsg, 'danger');
        }
      } else {
        const errorMsg = data.error?.message || data.message || `Ошибка сервера: ${response.status}`;
        setServerError(errorMsg);
        if (showNotification) {
          showNotification(errorMsg, 'danger');
        }
      }
    } catch (error) {
      console.error('Ошибка при редактировании объявления:', error);
      const errorMsg = error.message || 'Произошла ошибка при обновлении объявления';
      setServerError(errorMsg);
      if (showNotification) {
        showNotification(errorMsg, 'danger');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Редактировать объявление</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {serverError && (
          <Alert variant="danger" className="mb-3">
            <strong>Ошибка сервера:</strong> {serverError}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Вид животного</Form.Label>
            <Form.Control
              type="text"
              value={pet.kind}
              readOnly
              disabled
            />
            <Form.Text className="text-muted">Вид животного нельзя изменить</Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Район</Form.Label>
            <Form.Control
              type="text"
              value={pet.district}
              readOnly
              disabled
            />
            <Form.Text className="text-muted">Район нельзя изменить</Form.Text>
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
              Описание <span className="text-danger">*</span>
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
            <Form.Label>Фотографии животного</Form.Label>
            <Alert variant="info" className="mb-2">
              <small>Загружайте новые фотографии только если хотите заменить старые. Все фотографии должны быть в формате PNG</small>
            </Alert>
            <Row>
              <Col md={4} className="mb-3">
                <Form.Label htmlFor="photo1">
                  Фото 1 {photos.photo1 && <span className="text-success">(новое)</span>}
                </Form.Label>
                <Form.Control
                  type="file"
                  className={errors.photo1 ? 'is-invalid' : ''}
                  id="photo1"
                  accept=".png"
                  onChange={(e) => handleFileChange(e, 1)}
                />
                {errors.photo1 && <Form.Control.Feedback type="invalid">{errors.photo1}</Form.Control.Feedback>}
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label htmlFor="photo2">
                  Фото 2 {photos.photo2 && <span className="text-success">(новое)</span>}
                </Form.Label>
                <Form.Control
                  type="file"
                  className={errors.photo2 ? 'is-invalid' : ''}
                  id="photo2"
                  accept=".png"
                  onChange={(e) => handleFileChange(e, 2)}
                />
                {errors.photo2 && <Form.Control.Feedback type="invalid">{errors.photo2}</Form.Control.Feedback>}
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label htmlFor="photo3">
                  Фото 3 {photos.photo3 && <span className="text-success">(новое)</span>}
                </Form.Label>
                <Form.Control
                  type="file"
                  className={errors.photo3 ? 'is-invalid' : ''}
                  id="photo3"
                  accept=".png"
                  onChange={(e) => handleFileChange(e, 3)}
                />
                {errors.photo3 && <Form.Control.Feedback type="invalid">{errors.photo3}</Form.Control.Feedback>}
              </Col>
            </Row>
          </Form.Group>
          
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Сохранение...
                </>
              ) : 'Сохранить изменения'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditPetModal;