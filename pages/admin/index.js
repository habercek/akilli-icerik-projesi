import { useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function AdminPage({ rssKaynaklari }) {
  const [newRssUrl, setNewRssUrl] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert(`Form gönderildi, ama henüz bir işlem yapmıyor. Gönderilen URL: ${newRssUrl}`);
    setNewRssUrl('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Yönetim Paneli</h1>
      
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Kayıtlı RSS Kaynakları</h2>
        {rssKaynaklari && rssKaynaklari.length > 0 ? (
          <ul>
            {rssKaynaklari.map((kaynak, index) => (
              <li key={index}>{kaynak}</li>
            ))}
          </ul>
        ) : (
          <p>Gösterilecek RSS kaynağı bulunamadı.</p>
        )}
      </div>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h2>Yeni Kaynak Ekle</h2>
        <form onSubmit={handleFormSubmit}>
          <input
            type="url"
            value={newRssUrl}
            onChange={(e) => setNewRssUrl(e.target.value)}
            placeholder="https://ornek.com/rss.xml"
            required
            style={{ width: '300px', padding: '8px', marginRight: '10px' }}
          />
          <button type="submit" style={{ padding: '8px 12px' }}>
            Ekle
          </button>
        </form>
      </div>

    </div>
  );
}

export async function getServerSideProps() {
  try {
    const siteRef = doc(db, 'sites', 'test-sitesi');
    const docSnap =
