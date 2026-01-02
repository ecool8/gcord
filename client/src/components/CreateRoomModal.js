import React, { useState } from 'react';

function CreateRoomModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    waitingRoomLevel: 'PUBLIC',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Пожалуйста, введите название комнаты');
      return;
    }
    onCreate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать новую комнату</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Название комнаты *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите название комнаты"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Описание комнаты (необязательно)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="waitingRoomLevel">Уровень доступа</label>
            <select
              id="waitingRoomLevel"
              name="waitingRoomLevel"
              value={formData.waitingRoomLevel}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            >
              <option value="PUBLIC">Публичная</option>
              <option value="AUTHENTICATED">Только для авторизованных</option>
              <option value="PRIVATE">Приватная</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRoomModal;

