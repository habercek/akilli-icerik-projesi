// pages/admin/articles/index.js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

function ArticlesPage({ articles }) {
  const router = useRouter();
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [translatingId, setTranslatingId] = useState(null);

  const handleSelectArticle = (id) => {
    setSelectedArticles(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(articleId => articleId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedArticles(articles.map(article => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArticles.length === 0) {
      alert('Lütfen silmek için en az bir makale seçin.');
      return;
    }
    const confirmDelete = confirm(`${selectedArticles.length} makaleyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch('/api/delete-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedArticles }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Silme sırasında bir hata oluştu.');
      }
      alert('Seçilen makaleler başarıyla silindi.');
      router.reload();
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  };
  
  const handleTranslate = async (articleId) => {
    setTranslatingId(articleId);
    setError(null);
    try {
        const response = await fetch('/api/translate-article', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: articleId }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Çeviri sırasında bir hata oluştu.');
        }
        alert('Makale başarıyla çevrildi!');
        router.reload();
    } catch (err) {
        alert(`Hata: ${err.message}`);
        setTranslatingId(null);
    }
  };

  const allSelected = articles.length > 0 && selectedArticles.length === articles.length;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' }}>
      <a href="/admin" style={{ textDecoration: 'none', color: '#007bff' }}>&larr; Ana Yönetim Paneline Geri Dön</a>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Makale Yönetimi</h1>
      <p>Veritabanında bulunan toplam makale sayısı: {articles.length}</p>
      
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
         <button 
            onClick={handleDeleteSelected} 
            disabled={isDeleting || selectedArticles.length === 0}
            style={{ 
                backgroundColor: selectedArticles.length > 0 ? '#dc3545' : '#6c757d',
                color: 'white', border: 'none', padding: '10px 15px',
                borderRadius: '5px', cursor: 'pointer'
            }}
          >
            {isDeleting ? 'Siliniyor...' : `Seçilenleri Sil (${selectedArticles.length})`}
         </button>
         {error && <p style={{ color: 'red', marginLeft: '15px' }}>Hata: {error}</p>}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ width: '18px', height: '18px' }} />
              </th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Başlık</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Durum</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Eklenme Tarihi</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} style={{ borderBottom: '1px solid #eee', backgroundColor: selectedArticles.includes(article.id) ? '#fff3cd' : 'transparent' }}>
                <td style={{ padding: '12px' }}>
                  <input type="checkbox" checked={selectedArticles.includes(article.id)} onChange={() => handleSelectArticle(article.id)} style={{ width: '18px', height: '18px' }}/>
                </td>
                <td style={{ padding: '12px', minWidth: '300px' }}>{article.title}</td>
                <td style={{ padding: '12px' }}>
                    <span style={{ 
                        backgroundColor: article.durum === 'ham' ? '#ffc107' : (article.durum === 'çevrildi' ? '#17a2b8' : '#28a745'), 
                        color: 'white', 
                        padding: '3px 8px', borderRadius: '12px', 
                        fontSize: '12px', fontWeight: 'bold' 
                    }}>
                        {article.durum}
                    </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px', whiteSpace: 'nowrap' }}>{new Date(article.eklenmeTarihi).toLocaleString('tr-TR')}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {article.durum === 'ham' && (
                    <button 
                        onClick={() => handleTranslate(article.id)}
                        disabled={translatingId === article.id}
                        style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
                    >
                        {translatingId === article.id ? 'Çevriliyor...' : 'Türkçeye Çevir'}
                    </button>
                  )}
                  {article.durum === 'çevrildi' && (
                    <a 
                        href={`/admin/articles/${article.id}`}
                        style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', textDecoration: 'none' }}
                    >
                        İncele ve Düzenle
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Gösterilecek makale bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const articlesRef = collection(db, 'articles');
    const querySnapshot = await getDocs(articlesRef);
    const articles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title || 'Başlık Yok',
            durum: data.durum || 'Bilinmiyor',
            eklenmeTarihi: data.eklenmeTarihi.toDate().toISOString(), 
        };
    });
    articles.sort((a, b) => new Date(b.eklenmeTarihi) - new Date(a.eklenmeTarihi));
    return { props: { articles } };
  } catch (error) {
    console.error("Makaleleri çekerken hata:", error);
    return { props: { articles: [] } };
  }
}

export default ArticlesPage;
