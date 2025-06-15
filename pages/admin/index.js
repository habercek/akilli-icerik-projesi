// pages/admin/index.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function AdminPage({ rssKaynaklari }) {
  const router = useRouter();
  const [newRssUrl, setNewRssUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const [deletingUrl, setDeletingUrl] = useState(null);

  const handleAddRss = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/add-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newRssUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bir hata oluştu.');
      }
      setNewRssUrl('');
      router.reload();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleFetchNews = async () => {
    setIsFetching(true);
    setFetchMessage('Haberler çekiliyor, lütfen bekleyin...');
    try {
      const response = await fetch('/api/fetch-news', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Haberler çekilirken bir hata oluştu.');
      }
      setFetchMessage(result.message);
    } catch (err) {
      setFetchMessage(`Hata: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleDeleteRss = async (urlToDelete) => {
    setDeletingUrl(urlToDelete);
    try {
      const response = await fetch('/api/delete-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToDelete }),
      });
       if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Silme sırasında bir hata oluştu.');
      }
      router.reload();
    } catch (err) {
      setError(err.message);
      setDeletingUrl(null);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto' }}>
      <h1>Yönetim Paneli</h1>
      
      {/* --- YENİ EKLENEN BÖLÜM --- */}
      <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f0f8ff' }}>
        <h2>Yönetim Sayfaları</h2>
        <a href="/admin/articles" style={{ textDecoration: 'none', color: 'white', backgroundColor: '#007bff', padding: '10px 15px', borderRadius: '5px', display: 'inline-block', fontSize: '16px' }}>
          Makale Yönetimine Git &rarr;
        </a>
      </div>
      {/* --- BİTİŞ --- */}
      
      <div style={{ border: '1px solid #28a745', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f0fff4' }}>
        <h2>Otomasyon</h2>
        <button onClick={handleFetchNews} disabled={isFetching} style={{ padding: '10px 15px', fontSize: '16px', cursor: 'pointer' }}>
          {isFetching ? 'İşlem Sürüyor...' : 'Tüm Kaynaklardan Haberleri Çek'}
        </button>
        {fetchMessage && <p style={{ marginTop: '10px' }}>{fetchMessage}</p>}
      </div>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Kayıtlı RSS Kaynakları</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rssKaynaklari.map((kaynak, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ wordBreak: 'break-all', marginRight: '15px' }}>{kaynak}</span>
              <button onClick={() => handleDeleteRss(kaynak)} disabled={deletingUrl === kaynak} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {deletingUrl === kaynak ? 'Siliniyor...' : 'Sil'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h2>Yeni Kaynak Ekle</h2>
        <form onSubmit={handleAddRss}>
          <input
            type="url" value={newRssUrl} onChange={(e) => setNewRssUrl(e.target.value)}
            placeholder="https://ornek.com/rss.xml" required
            style={{ width: '300px', padding: '8px', marginRight: '10px' }}
          />
          <button type="submit" disabled={isSubmitting} style={{ padding: '8px 12px' }}>
            {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>Hata: {error}</p>}
        </form>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const siteRef = doc(db, 'sites', 'test-sitesi');
    const docSnap = await getDoc(siteRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const rssKaynaklari = data.rssKaynaklari || [];
      return { props: { rssKaynaklari } };
    } else {
      return { props: { rssKaynaklari: [] } };
    }
  } catch (error) {
    console.error("Firebase'den veri çekerken hata:", error);
    return { props: { rssKaynaklari: [] } };
  }
}

export default AdminPage;
