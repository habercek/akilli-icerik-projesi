// pages/admin/articles/edit/[id].js

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase'; // ../../'dan ../../../'e dikkat
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function EditArticlePage({ articleData }) {
  const router = useRouter();
  const [translatedContent, setTranslatedContent] = useState(articleData.ceviri_icerik || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      // Bu API'yi bir sonraki adımda oluşturacağız
      alert("Kaydetme fonksiyonu henüz aktif değil.");
      // const { id } = router.query;
      // await updateDoc(doc(db, 'articles', id), {
      //   ceviri_icerik: translatedContent
      // });
      // setMessage('Değişiklikler başarıyla kaydedildi!');
      
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!articleData) {
    return <div>Makale yükleniyor veya bulunamadı...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <a href="/admin/articles" style={{ textDecoration: 'none', color: '#007bff' }}>&larr; Makale Listesine Geri Dön</a>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Makale İncele ve Düzenle</h1>
      <h3 style={{ fontWeight: 'normal' }}>{articleData.title}</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>Orijinal Metin (Ham)</h2>
          <textarea
            readOnly
            value={articleData.content || 'Orijinal içerik bulunamadı.'}
            style={{ width: '100%', height: '400px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f8f9fa' }}
          />
        </div>
        <div>
          <h2>Çevrilmiş Metin (Düzenlenebilir)</h2>
          <form onSubmit={handleSave}>
            <textarea
              value={translatedContent}
              onChange={(e) => setTranslatedContent(e.target.value)}
              style={{ width: '100%', height: '400px', padding: '10px', border: '1px solid #007bff', borderRadius: '5px' }}
            />
            <button type="submit" disabled={isSaving} style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px' }}>
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
            {message && <p style={{ marginTop: '10px' }}>{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.params; // Dinamik URL'den [id] parametresini al
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { notFound: true }; // Makale bulunamazsa 404 sayfası göster
    }

    const data = docSnap.data();
    // Sayfaya prop olarak gönderilecek veriyi güvenli hale getiriyoruz
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
```
5.  **Kaydedin:** Sayfanın altındaki yeşil **"Commit new file"** butonuna basın.

---

### **Test Etme Zamanı**

1-2 dakika bekledikten sonra **Makale Yönetim** sayfasını yenileyin:
**[https://akilli-icerik-projesi.vercel.app/admin/articles](https://akilli-icerik-projesi.vercel.app/admin/articles)**

* Durumu "çevrildi" olan bir makalenin yanındaki butonun artık sarı renkli bir **"İncele ve Düzenle"** linkine dönüştüğünü göreceksiniz.
* Bu linke tıkladığınızda, sizi o makaleye özel yeni düzenleme sayfasına götürmeli.
* Yeni sayfada, solda orijinal metni, sağda ise düzenlenebilir çevrilmiş metni görmelisiniz. "Değişiklikleri Kaydet" butonu henüz bir işlem yapmayacak.

Bu adımları tamamladığınızda, projenin kalite kontrol arayüzü hazır olacak. Sonucu bekliyor
