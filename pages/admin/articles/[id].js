// pages/admin/articles/[id].js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function EditArticlePage({ articleData }) {
  const router = useRouter();
  const [translatedContent, setTranslatedContent] = useState(articleData.ceviri_icerik || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('preview');

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const { id } = router.query;
      const response = await fetch('/api/update-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: translatedContent }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Makale güncellenirken bir hata oluştu.');
      }
      
      setMessage('Değişiklikler başarıyla kaydedildi!');
      
    } catch (err) {
      setError(`Hata: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptimize = () => {
      alert("Yapay Zeka Optimizasyon fonksiyonu bir sonraki adımda eklenecektir.");
  };

  if (!articleData) {
    return <div>Makale yükleniyor veya bulunamadı...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <a href="/admin/articles" style={{ textDecoration: 'none', color: '#007bff' }}>&larr; Makale Listesine Geri Dön</a>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Makale İncele ve Düzenle</h1>
      <h3 style={{ fontWeight: 'normal' }}>{articleData.title}</h3>
      <div>
        <form onSubmit={handleSave}>
          <h2>Çevrilmiş Metin</h2>
          <div style={{ marginBottom: '1rem' }}>
            <button 
              type="button"
              onClick={() => setViewMode('preview')} 
              disabled={viewMode === 'preview'}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                border: '1px solid #ccc',
                backgroundColor: viewMode === 'preview' ? '#007bff' : 'white',
                color: viewMode === 'preview' ? 'white' : 'black'
              }}
            >
              Canlı Önizleme
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('html')} 
              disabled={viewMode === 'html'}
              style={{
                marginLeft: '0.5rem',
                padding: '8px 12px',
                cursor: 'pointer',
                border: '1px solid #ccc',
                backgroundColor: viewMode === 'html' ? '#007bff' : 'white',
                color: viewMode === 'html' ? 'white' : 'black'
              }}
            >
              HTML Kodunu Düzenle
            </button>
          </div>
          {viewMode === 'preview' ? (
            <div
              style={{ 
                width: '100%', 
                height: '424px', 
                border: '1px solid #ccc', 
                borderRadius: '5px',
                padding: '10px', 
                backgroundColor: '#f9f9f9',
                overflowY: 'auto' 
              }}
              dangerouslySetInnerHTML={{ __html: translatedContent }}
            />
          ) : (
            <textarea
              value={translatedContent}
              onChange={(e) => setTranslatedContent(e.target.value)}
              style={{ 
                width: '100%', 
                height: '424px', 
                padding: '10px', 
                border: '1px solid #007bff', 
                borderRadius: '5px',
                fontFamily: 'monospace'
              }}
            />
          )}
          <div style={{marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
              <button 
                  type="button"
                  onClick={handleOptimize} 
                  style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Yapay Zeka ile Optimize Et &rarr;
              </button>
          </div>
          {message && <p style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
          {error && <p style={{ marginTop: '10px', color: 'red' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.params;
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { notFound: true };
    }

    const data = docSnap.data();
    const articleData = {
      id: docSnap.id,
      title: data.title || 'Başlık Yok',
      content: data.content || '',
      ceviri_icerik: data.ceviri_icerik || ''
    };

    return {
      props: {
        articleData,
      },
    };
  } catch (error) {
    console.error("Makale detayı çekerken hata:", error);
    return { props: { articleData: null } };
  }
}

export default EditArticlePage;
