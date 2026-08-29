import { API_BASE_URL } from '../../apiConfig';
import { useState, useEffect } from 'react';
import AboutLayout from './AboutLayout';

const Concession_for_students = () => {
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`${API_BASE_URL}/concession`);
      const data = await response.json();

      if (data) {
        setContent(data.content);
        if (data.photo) {
          setPhoto(data.photo);
        } else {
          setPhoto('/storage/photos/shares/1583722555asasa.jpg');
        }
      }
    };

    fetchData();
  }, []);

  return <AboutLayout content={content} photo={photo} subtitle="Concession For Students" />;
};

export default Concession_for_students;
