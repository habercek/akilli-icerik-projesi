import { db } from '../../firebase'; // Firebase bağlantı dosyamız
import { doc, getDoc } from 'firebase/firestore';

// Sayfa Bileşeni: Gelen veriyi ekranda gösterir.
function AdminPage({ rssKaynaklari }) {
  return (
    <div>
      <h1>Yönetim Paneli</h1>
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
  );
}

// Sunucu Tarafı Veri Çekme Fonksiyonu
export async function getServerSideProps() {
  try {
    // 'sites' koleksiyonundaki 'test-sitesi' belgesine referans ver
    const siteRef = doc(db, 'sites', 'test-sitesi');
    
    // Belgeyi veritabanından çek
    const docSnap = await getDoc(siteRef);

    if (docSnap.exists()) {
      // Belge varsa, içindeki rssKaynaklari dizisini al
      const data = docSnap.data();
      const rssKaynaklari = data.rssKaynaklari || []; // Eğer alan yoksa boş dizi ata
      
      return {
        props: {
          rssKaynaklari,
        },
      };
    } else {
      // Belge bulunamazsa
      console.log("'test-sitesi' belgesi bulunamadı.");
      return {
        props: {
          rssKaynaklari: [],
        },
      };
    }
  } catch (error) {
    console.error("Firebase'den veri çekerken hata:", error);
    return {
      props: {
        rssKaynaklari: [], // Hata durumunda sayfaya boş veri gönder
      },
    };
  }
}

export default AdminPage;
