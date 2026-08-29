import { API_BASE_URL } from '../../apiConfig';
import { useState, useEffect } from 'react';
import AboutLayout from './AboutLayout';

const Controlling_Authority = () => {
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/controlling-authority`);
        const data = await response.json();

        if (data) {
          setContent(data.content || 'Content not available');
          setPhoto(
            data.photo ||
              '/storage/photos/shares/Neded%20Picture/1583723116IMG_9692.jpg'
          );
        }
      } catch (error) {
        console.error('Error fetching Controlling Authority data:', error);
        setContent('Error loading content.');
      }
    };

    fetchData();
  }, []);

  return <AboutLayout content={content} photo={photo} subtitle="Controlling Authority" />;
};

export default Controlling_Authority;
