import { API_BASE_URL } from '../../apiConfig';
import { useState, useEffect } from 'react';
import AboutLayout from './AboutLayout';

const Short_Breif_of_Institute = () => {
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/short-brief`);
        const data = await response.json();

        if (data) {
          setContent(data.content || 'Content not available');
          setPhoto(
            data.photo ||
              '/storage/photos/shares/15451150562222_copy.jpg'
          );
        }
      } catch (error) {
        console.error('Error fetching Short Brief data:', error);
        setContent('Error loading content.');
      }
    };

    fetchData();
  }, []);

  return <AboutLayout content={content} photo={photo} subtitle="Short Brief of Institute" />;
};

export default Short_Breif_of_Institute;
