// Firebase veritabanımıza ve gerekli fonksiyonlara bağlanıyoruz
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Sayfa bileşenimiz, artık "sites" adında bir veri alacak
export default function HomePage({ sites }) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Akıllı İçerik Platformu</h1>
      <p>Projemiz bu sefer kesin kuruldu!</p>
      
      <hr style={{ margin: '20px 0' }} />

      <h2>Veritabanından Gelen Siteler:</h2>
      
      {/* Eğer veri geldiyse, listeyi göster */}
      {sites.length > 0 ? (
        <ul>
          {/* Her bir site için bir liste elemanı oluştur */}
          {sites.map(site => (
            <li key={site.id}>{site.siteAdi}</li>
          ))}
        </ul>
      ) : (
        // Eğer veri gelmediyse, bu mesajı göster
        <p>Gösterilecek site bulunamadı veya veritabanı bağlantısında bir sorun var.</p>
      )}
    </div>
  );
}

// Bu özel fonksiyon, sayfa kullanıcıya gösterilmeden ÖNCE sunucuda çalışır.
// Veritabanından veriyi çekmek için en iyi yer burasıdır.
export async function getServerSideProps() {
  try {
    // "sites" koleksiyonuna bağlan
    const sitesCollection = collection(db, 'sites');
    
    // Koleksiyondaki tüm dökümanları çek
    const siteSnapshot = await getDocs(sitesCollection);
    
    // Gelen veriyi daha basit bir formata dönüştür
    const siteList = siteSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Çektiğimiz veriyi "props" olarak sayfaya gönder
    return {
      props: {
        sites: siteList,
      },
    };
  } catch (error) {
    console.error("Firebase'den veri çekerken hata:", error);
    // Hata olursa, boş bir liste gönder
    return {
      props: {
        sites: [],
      },
    };
  }
}
