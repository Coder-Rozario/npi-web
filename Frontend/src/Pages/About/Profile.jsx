import { API_BASE_URL } from '../../apiConfig';
import { useState, useEffect } from 'react';
import AboutLayout from './AboutLayout';

const Profile = () => {
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/profile`);
        const data = await response.json();
        if (data) {
          setContent(data.content || '');
          setPhoto(data.photo || '/storage/photos/shares/15451150562222_copy.jpg');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return <AboutLayout content={content} photo={photo} subtitle="Technical Excellence" />;
};

export default Profile;
