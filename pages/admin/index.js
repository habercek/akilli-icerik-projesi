// pages/admin/index.js

import { useState } from 'react';
import { useRouter } from 'next/router'; // Sayfayı yenilemek için
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function AdminPage({ rssKaynaklari }) {
  const router = useRouter(); // Router hook'unu kullanıma al
  const [newRssUrl, setNewRssUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form gönderme fonksiyonunu güncelliyoruz
  const handleFormSubmit = async (e) => {
    e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle
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
      
      // Başarılı olursa input'u temizle ve sayfayı yenileyerek güncel listeyi göster
      setNewRssUrl('');
      router.reload();

    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Yönetim Paneli</h1>
      
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Kayıtlı RSS Kaynakları</h2>
        {rssKaynaklari && rssKaynaklari.length > 0 ? (
          <ul>
            {rssKaynaklari.map((kaynak, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>{kaynak}</li>
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
          <button type="submit" disabled={isSubmitting} style={{ padding: '8px 12px' }}>
            {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
          </button>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>Hata: {error}</p>}
        </form>
      </div>
    </div>
  );
}

// Sunucu Tarafı Veri Çekme Fonksiyonu (Değişiklik yok)
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
