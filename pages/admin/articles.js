// pages/admin/articles.js

import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Bu, makaleleri listeleyen sayfa bileşenidir.
function ArticlesPage({ articles }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: 'auto' }}>
      <a href="/admin" style={{ textDecoration: 'none', color: '#007bff' }}>&larr; Ana Yönetim Paneline Geri Dön</a>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Makale Yönetimi</h1>
      <p>Veritabanında bulunan toplam makale sayısı: {articles.length}</p>
      
      {/* Gelecekte buraya fonksiyonel silme butonu ve diğer işlemler eklenecek */}
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
         <button disabled>Seçilenleri Sil</button>
         <span style={{ marginLeft: '15px', fontSize: '14px', color: '#6c757d' }}>(Silme işlevi bir sonraki adımda eklenecektir)</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}><input type="checkbox" disabled /></th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Başlık</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Durum</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Eklenme Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}><input type="checkbox" disabled /></td>
                <td style={{ padding: '12px' }}>{article.title}</td>
                <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#ffc107', color: 'black', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{article.durum}</span></td>
                <td style={{ padding: '12px', fontSize: '14px', whiteSpace: 'nowrap' }}>{new Date(article.eklenmeTarihi).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Gösterilecek makale bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sunucu tarafında veritabanından tüm makaleleri çekeriz.
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
            // Tarih nesnesini serileştirilebilir formata çeviriyoruz.
            eklenmeTarihi: data.eklenmeTarihi.toDate().toISOString(), 
        };
    });

    // Son eklenenler en üstte görünsün diye kendi içinde sırala
    articles.sort((a, b) => new Date(b.eklenmeTarihi) - new Date(a.eklenmeTarihi));

    return {
      props: {
        articles,
      },
    };
  } catch (error) {
    console.error("Makaleleri çekerken hata:", error);
    return {
      props: {
        articles: [],
      },
    };
  }
}

export default ArticlesPage;
