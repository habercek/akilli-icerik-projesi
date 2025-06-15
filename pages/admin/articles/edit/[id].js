// pages/admin/articles/edit/[id].js - GEÇİCİ TEST KODU

function TestEditPage() {
  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>TEST SAYFASI BAŞARIYLA YÜKLENDİ!</h1>
      <p>Eğer bu mesajı görüyorsanız, dosya yapısı ve yönlendirme (routing) doğru çalışıyor demektir.</p>
      <p>Sorun, bir önceki kodun getServerSideProps fonksiyonundaydı.</p>
      <a href="/admin/articles">Makale Listesine Geri Dön</a>
    </div>
  );
}

export default TestEditPage;
