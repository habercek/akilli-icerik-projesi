// pages/admin/index.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// --- YARDIMCI BİLEŞEN: API Anahtar Yönetimi ---
// Bu bileşen sadece arayüzü çizmek ve ana bileşenden fonksiyonları almakla sorumlu.
function ApiKeyManager({ 
    initialApiKeys = [], 
    onAddKey, 
    onDeleteKey, 
    isSubmitting, 
    deletingKey,
    error 
}) {
  const [newApiKey, setNewApiKey] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddKey(newApiKey);
    setNewApiKey(''); // Formu temizle
  };

  const maskApiKey = (key) => {
    if (!key || key.length < 15) return '********:fx';
    return `********-****-****-****-${key.slice(-15)}`;
  };

  return (
    <div style={{ border: '1px solid #6f42c1', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f5f0ff' }}>
        <h2>API Anahtar Yönetimi (DeepL)</h2>
        <p style={{fontSize: '14px', color: '#6c757d'}}>Kullanılabilir API anahtarlarını buraya ekleyin. Sistem, kota dolduğunda otomatik olarak bir sonrakine geçecektir.</p>
        
        <form onSubmit={handleAddSubmit} style={{ marginBottom: '15px' }}>
            <input
                type="text"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Yeni DeepL API Anahtarını Yapıştırın"
                required
                style={{ width: '400px', padding: '8px', marginRight: '10px' }}
            />
            <button type="submit" disabled={isSubmitting} style={{ padding: '8px 12px' }}>
                {isSubmitting ? 'Ekleniyor...' : 'Yeni Anahtar Ekle'}
            </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>Hata: {error}</p>}

        <h4>Kayıtlı Anahtarlar:</h4>
        {initialApiKeys.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {initialApiKeys.map((apiKey, index) => (
                    <li key={index} style={{ fontFamily: 'monospace', backgroundColor: '#e9ecef', padding: '5px 10px', borderRadius: '5px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{maskApiKey(apiKey)}</span>
                        <button 
                            onClick={() => onDeleteKey(apiKey)} 
                            disabled={deletingKey === apiKey}
                            style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                           {deletingKey === apiKey ? 'Siliniyor...' : 'Sil'}
                        </button>
                    </li>
                ))}
            </ul>
        ) : (
            <p style={{fontSize: '14px'}}>Henüz kayıtlı API anahtarı yok.</p>
        )}
    </div>
  );
}

// --- ANA SAYFA BİLEŞENİ ---
function AdminPage({ siteData }) {
  const router = useRouter();
  // RSS Form State'leri
  const [newRssUrl, setNewRssUrl] = useState('');
  const [isSubmittingRss, setIsSubmittingRss] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);

  // Haber Çekme State'leri
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  // API Anahtar State'leri
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [apiKeyError, setApiKeyError] = useState(null);

  // --- FONKSİYONLAR ---

  const handleAddRss = async (e) => {
    e.preventDefault();
    setIsSubmittingRss(true);
    try {
      const response = await fetch('/api/add-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newRssUrl }),
      });
      if (!response.ok) throw new Error('RSS eklenemedi.');
      router.reload();
    } catch (err) {
      alert(err.message);
      setIsSubmittingRss(false);
    }
  };

  const handleDeleteRss = async (urlToDelete) => {
    if (!confirm("Bu RSS kaynağını silmek istediğinizden emin misiniz?")) return;
    setDeletingUrl(urlToDelete);
    try {
      const response = await fetch('/api/delete-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToDelete }),
      });
       if (!response.ok) throw new Error('RSS silinemedi.');
      router.reload();
    } catch (err) {
      alert(err.message);
      setDeletingUrl(null);
    }
  };

  const handleFetchNews = async () => {
    setIsFetching(true);
    setFetchMessage('Haberler çekiliyor, lütfen bekleyin...');
    try {
      const response = await fetch('/api/fetch-news', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Haberler çekilirken bir hata oluştu.');
      setFetchMessage(result.message);
    } catch (err) {
      setFetchMessage(`Hata: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddApiKey = async (key) => {
    setIsSubmittingKey(true);
    setApiKeyError(null);
    try {
      const response = await fetch('/api/add-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!response.ok) throw new Error('API anahtarı eklenemedi.');
      router.reload();
    } catch (err) {
      setApiKeyError(err.message);
    } finally {
      setIsSubmittingKey(false);
    }
  };

  const handleDeleteApiKey = async (key) => {
    if (!confirm("Bu API anahtarını silmek istediğinizden emin misiniz?")) return;
    setDeletingKey(key);
    setApiKeyError(null);
    try {
        const response = await fetch('/api/delete-api-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
        });
        if (!response.ok) throw new Error('API anahtarı silinemedi.');
        router.reload();
    } catch (err) {
        setApiKeyError(err.message);
    } finally {
        setDeletingKey(null);
    }
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto' }}>
      <h1>Yönetim Paneli</h1>
      
      <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#f0f8ff' }}>
        <h2>Yönetim Sayfaları</h2>
        <a href="/admin/articles" style={{ textDecoration: 'none', color: 'white', backgroundColor: '#007bff', padding: '10px 15px', borderRadius: '5px', display: 'inline-block', fontSize: '16px' }}>
          Makale Yönetimine Git &rarr;
        </a>
      </div>
      
      <ApiKeyManager 
        initialApiKeys={siteData.apiKeys}
        onAddKey={handleAddApiKey}
        onDeleteKey={handleDeleteApiKey}
        isSubmitting={isSubmittingKey}
        deletingKey={deletingKey}
        error={apiKeyError}
      />

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
          {siteData.rssKaynaklari.map((kaynak, index) => (
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
          <button type="submit" disabled={isSubmittingRss} style={{ padding: '8px 12px' }}>
            {isSubmittingRss ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- VERİ ÇEKME FONKSİYONU ---
export async function getServerSideProps() {
  try {
    const siteRef = doc(db, 'sites', 'test-sitesi');
    const docSnap = await getDoc(siteRef);

    let siteData = { rssKaynaklari: [], apiKeys: [] };

    if (docSnap.exists()) {
      const data = docSnap.data();
      siteData.rssKaynaklari = data.rssKaynaklari || [];
      siteData.apiKeys = data.deepl_keys || []; 
    }
    
    return { props: { siteData } };

  } catch (error) {
    console.error("Firebase'den veri çekerken hata:", error);
    return { props: { siteData: { rssKaynaklari: [], apiKeys: [] } } };
  }
}

export default AdminPage;

