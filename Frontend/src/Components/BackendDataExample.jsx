import React from 'react';
import { useFetchData, postData } from '../hooks/useFetchData';

/**
 * Example Component - Backend Data Fetching
 * এটি একটি সম্পূর্ণ উদাহরণ যেখানে বিভিন্ন endpoints থেকে ডেটা ফেচ করা হয়েছে
 */

export const BackendDataExample = () => {
  // বিভিন্ন endpoints থেকে ডেটা ফেচ করা
  const { data: news, loading: loadingNews } = useFetchData('/news');
  const { data: teachers, loading: loadingTeachers } = useFetchData('/teachers');
  const { data: portfolio, loading: loadingPortfolio } = useFetchData('/portfolio');
  const { data: notices } = useFetchData('/get-notices');
  const { data: photos } = useFetchData('/photos');
  const { data: videos } = useFetchData('/videos');
  const { data: counters } = useFetchData('/counters');

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test message',
      };
      const response = await postData('/submit-form', formData);
      console.log('Form submitted:', response);
      alert('ফর্ম সফলভাবে জমা হয়েছে!');
    } catch (err) {
      alert('ফর্ম জমা দিতে ব্যর্থ: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>📡 Backend Data Fetching Example</h1>

      {/* News Section */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>🗞️ সংবাদ (News)</h2>
        {loadingNews ? (
          <p>লোড হচ্ছে...</p>
        ) : (
          <div>
            <p>মোট সংবাদ: {news?.length || 0}</p>
            {news?.slice(0, 3).map((item) => (
              <div key={item.id} style={{ marginBottom: '10px', background: '#f9f9f9', padding: '10px' }}>
                <h4>{item.title}</h4>
                <p>{item.description?.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teachers Section */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>👨‍🏫 শিক্ষকবৃন্দ (Teachers)</h2>
        {loadingTeachers ? (
          <p>লোড হচ্ছে...</p>
        ) : (
          <div>
            <p>মোট শিক্ষক: {teachers?.length || 0}</p>
            {teachers?.slice(0, 3).map((teacher) => (
              <div key={teacher.id} style={{ marginBottom: '10px', background: '#f9f9f9', padding: '10px' }}>
                <h4>{teacher.name}</h4>
                <p>{teacher.position} | {teacher.department}</p>
                <p>Email: {teacher.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>🎨 পোর্টফোলিও (Portfolio)</h2>
        {loadingPortfolio ? (
          <p>লোড হচ্ছে...</p>
        ) : (
          <div>
            <p>মোট পোর্টফোলিও আইটেম: {portfolio?.length || 0}</p>
            {portfolio?.slice(0, 3).map((item) => (
              <div key={item.id} style={{ marginBottom: '10px', background: '#f9f9f9', padding: '10px' }}>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>📊 দ্রুত পরিসংখ্যান</h2>
        <ul>
          <li>মোট নোটিশ: {notices?.length || 0}</li>
          <li>মোট ছবি: {photos?.length || 0}</li>
          <li>মোট ভিডিও: {videos?.length || 0}</li>
          <li>কাউন্টার ডেটা: {counters?.length || 0}</li>
        </ul>
      </div>

      {/* Form Submit Example */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h2>📝 ফর্ম জমা দেওয়ার উদাহরণ</h2>
        <button
          onClick={handleSubmitForm}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          টেস্ট ফর্ম জমা দিন
        </button>
      </div>
    </div>
  );
};

export default BackendDataExample;
