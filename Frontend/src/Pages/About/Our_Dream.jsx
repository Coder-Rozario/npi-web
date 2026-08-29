import { API_BASE_URL } from '../../apiConfig';
import { useState, useEffect } from 'react';
import AboutLayout from './AboutLayout';

const Our_Dream = () => {
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/our-dream`);
        const data = await response.json();

        if (data) {
          setContent(data.content || 'Default content if none is available.');
          setPhoto(data.photo || '/storage/photos/shares/15451150562222_copy.jpg');
        }
      } catch (error) {
        console.error('Error fetching Our Dream data:', error);
      }
    };

    fetchData();
  }, []);

  return <AboutLayout content={content} photo={photo} subtitle="Our Dream" />;
};

export default Our_Dream;
