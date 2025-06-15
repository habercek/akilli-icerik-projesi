export default function AdminPage() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1>Yönetim Paneli</h1>
      <p>Burası sadece bizim görebileceğimiz özel alanımız.</p>
      
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Yapılacaklar:</h2>
        <ul>
          <li>RSS Kaynaklarını listele</li>
          <li>Yeni RSS Kaynağı ekleme formu</li>
          <li>"Haberleri Çek" butonu</li>
        </ul>
      </div>
    </div>
  );
}
