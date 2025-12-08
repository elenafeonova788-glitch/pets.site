import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, Form, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeoutRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Запускаем новый таймер для поиска при вводе более 3 символов
    if (value.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      }, 1000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar expand="lg" className="custom-navbar navbar-expand-lg navbar-light">
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/11647/11647571.png" 
            className="logo-img rounded-3" 
            alt="logo" 
          />
          <span className="ms-2 fw-bold align-middle">GET PET BACK</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbarNav" />
        
        <Navbar.Collapse id="navbarNav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/add-pet" 
              className={isActive('/add-pet') ? 'active' : ''}
            >
              Добавить объявление
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/search" 
              className={isActive('/search') ? 'active' : ''}
            >
              Поиск по объявлениям
            </Nav.Link>
          </Nav>
          
          <Form className="d-flex me-2" onSubmit={handleSearch}>
            <Form.Control
              type="search"
              placeholder="Поиск по животным..."
              className="me-2"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
            />
            <Button type="submit" variant="outline-light">
              Поиск
            </Button>
          </Form>
          
          {!isAuthenticated ? (
            <div id="authSection">
              <Button 
                as={Link} 
                to="/registration" 
                variant="outline-light" 
                className="ms-2"
              >
                Регистрация
              </Button>
              <Button 
                as={Link} 
                to="/login" 
                variant="outline-light" 
                className="ms-2"
                id="loginBtn"
              >
                Вход
              </Button>
            </div>
          ) : (
            <div id="userSection">
              <Dropdown>
                <Dropdown.Toggle variant="outline-light" id="userDropdown">
                  {currentUser?.name || 'Пользователь'}
                </Dropdown.Toggle>
                
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    Личный кабинет
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    Выйти
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;