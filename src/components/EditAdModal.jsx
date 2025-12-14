import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

const EditAdModal = ({ ad, show, onHide, onSave, loading }) => {
  const [formData, setFormData] = useState({
    description: '',
    mark: '',
    photos: []
  });
  const [errors, setErrors] = useState({});
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (ad) {
      setFormData({
        description: ad.description || '',
        mark: ad.mark || '',
        photos: []
      });
      setPhotoPreviews([]);
      setErrors({});
      setApiError('');
    }
  }, [ad]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      if (files.length > 3) {
        setApiError('Можно загрузить не более 3 фотографий');
        e.target.value = '';
        return;
      }
      
      const newPhotos = Array.from(files);
      
      const invalidFiles = newPhotos.filter(file => file.type !== 'image/png');
      if (invalidFiles.length > 0) {
        setApiError('Разрешены только файлы формата PNG!');
        e.target.value = '';
        return;
      }
      
      const newPreviews = [];
      newPhotos.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target.result);
          if (newPreviews.length === newPhotos.length) {
            setPhotoPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
      
      setFormData(prev => ({
        ...prev,
        photos: newPhotos
      }));
      setApiError('');
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setApiError('');
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
    
    setPhotoPreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно для заполнения';
    }
    
    if (formData.photos.length > 0 && !formData.photos[0]) {
      newErrors.photos = 'Первая фотография обязательна';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
  };

  if (!ad) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Редактирование объявления</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {apiError && <Alert variant="danger" className="mb-3">{apiError}</Alert>}
        
        <Form id="editAdForm" onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="required-field">Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              isInvalid={!!errors.description}
              required
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Клеймо (если есть)</Form.Label>
            <Form.Control
              type="text"
              name="mark"
              value={formData.mark}
              onChange={handleChange}
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>
              Новые фотографии (только PNG, максимум 3, первая обязательна)
            </Form.Label>
            <Form.Control
              type="file"
              name="photos"
              onChange={handleChange}
              accept=".png,image/png"
              multiple
              isInvalid={!!errors.photos}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.photos}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Оставьте пустым, чтобы не изменять существующие фотографии
            </Form.Text>
            
            {photoPreviews.length > 0 && (
              <div className="mt-3">
                <h6>Новые фотографии:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="position-relative" style={{ width: '100px' }}>
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="photo-preview" 
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          objectFit: 'cover', 
                          borderRadius: '5px',
                          border: index === 0 ? '2px solid #007bff' : '1px solid #ddd'
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0"
                        style={{ transform: 'translate(50%, -50%)' }}
                        onClick={() => removePhoto(index)}
                        disabled={loading}
                      >
                        ×
                      </Button>
                      {index === 0 && (
                        <div className="position-absolute bottom-0 start-0 end-0 bg-primary text-white text-center py-1">
                          <small>Основное</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAdModal;